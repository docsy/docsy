import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractFaviconLinks } from './lib/extract.mjs';

const repoDir = fileURLToPath(new URL('../../../', import.meta.url));
const themesDir = repoDir.replace(/\/$/, '');
const hugoBin = join(repoDir, 'node_modules', '.bin', 'hugo');
const hugo = existsSync(hugoBin) ? hugoBin : 'hugo';

// Build a throwaway site that uses the theme, optionally with a site-supplied
// favicons partial and/or files in `static/`, and return the favicon `<link>`
// tags it emits. Guards #2595: the theme ships no icon files of its own, only
// the logic that links the ones a site supplies.
function buildSiteFavicons(
  partial,
  baseURL = 'http://localhost/',
  staticFiles = [],
) {
  const dir = mkdtempSync(join(tmpdir(), 'docsy-theme-favicons-'));
  try {
    writeFileSync(
      join(dir, 'hugo.toml'),
      [
        `baseURL = "${baseURL}"`,
        'title = "Minimal"',
        'theme = "theme"',
        'disableKinds = ["taxonomy","term","RSS","sitemap","404"]',
        '',
      ].join('\n'),
    );
    mkdirSync(join(dir, 'content'));
    writeFileSync(join(dir, 'content', '_index.md'), '---\ntitle: Home\n---\n');
    if (staticFiles.length) {
      mkdirSync(join(dir, 'static'), { recursive: true });
      // Existence is all the partial checks; content is irrelevant here.
      for (const file of staticFiles) {
        writeFileSync(join(dir, 'static', file), '');
      }
    }
    if (partial !== undefined) {
      mkdirSync(join(dir, 'layouts', '_partials'), { recursive: true });
      writeFileSync(
        join(dir, 'layouts', '_partials', 'favicons.html'),
        partial,
      );
    }
    const res = spawnSync(
      hugo,
      [
        '--themesDir',
        themesDir,
        '--cleanDestinationDir',
        '--logLevel',
        'error',
      ],
      {
        cwd: dir,
        encoding: 'utf8',
        // Ensure the theme's PostCSS/SCSS pipeline binaries resolve even when
        // the test runs outside an `npm run` PATH.
        env: {
          ...process.env,
          PATH: `${join(repoDir, 'node_modules', '.bin')}${delimiter}${process.env.PATH ?? ''}`,
          // An inherited HUGO_THEME (worktree checkouts) overrides the
          // pinned theme.
          HUGO_THEME: undefined,
        },
      },
    );
    const output = `${res.stdout ?? ''}${res.stderr ?? ''}`;
    assert.equal(res.status, 0, `Build failed:\n${output}`);
    return extractFaviconLinks(
      readFileSync(join(dir, 'public', 'index.html'), 'utf8'),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('theme emits no favicon links when the site supplies none', () => {
  assert.equal(buildSiteFavicons(), '');
});

// The default partial discovers conventionally named files a site drops
// in `static/` and links them, with no partial or config of its own.
test('theme discovers and links a site favicon from static/ with no partial', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon.ico',
  ]);
  assert.equal(links, '<link rel="icon" href="/favicon.ico" />\n');
});

test('theme discovers and links the full conventional favicon set from static/', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon.ico',
    'favicon.svg',
    'apple-touch-icon.png',
  ]);
  assert.match(links, /rel="icon" href="\/favicon\.ico"/);
  assert.match(
    links,
    /rel="icon" href="\/favicon\.svg" type="image\/svg\+xml"/,
  );
  assert.match(links, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
});

test('theme does not link favicon files a site has not supplied', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon.ico',
  ]);
  assert.doesNotMatch(links, /apple-touch-icon|favicon\.svg/);
});

// Lock the optional PNG-variant rows of the discovery table: when a site
// supplies the 16/32px PNGs, the partial links both with the right type/sizes.
test('theme discovers and links the optional 16/32px PNG variants from static/', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon-32x32.png',
    'favicon-16x16.png',
  ]);
  assert.match(
    links,
    /rel="icon" href="\/favicon-32x32\.png" type="image\/png" sizes="32x32"/,
  );
  assert.match(
    links,
    /rel="icon" href="\/favicon-16x16\.png" type="image\/png" sizes="16x16"/,
  );
});

// Discovery generalizes to any square favicon-NxN.png, linked in ascending
// pixel-size (numeric, not lexical) order.
test('theme discovers any square favicon PNG variant, sorted by size', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon-128x128.png',
    'favicon-16x16.png',
    'favicon-48x48.png',
  ]);
  assert.match(
    links,
    /rel="icon" href="\/favicon-48x48\.png" type="image\/png" sizes="48x48"/,
  );
  assert.match(
    links,
    /rel="icon" href="\/favicon-128x128\.png" type="image\/png" sizes="128x128"/,
  );
  const order = [...links.matchAll(/favicon-(\d+)x\d+\.png/g)].map((m) =>
    Number(m[1]),
  );
  assert.deepEqual(
    order,
    [16, 48, 128],
    'PNG variants are linked in ascending pixel-size order',
  );
});

// Discovery generalizes to the Apple touch icon: the unsized
// apple-touch-icon.png plus any square apple-touch-icon-NxN.png variants, each
// linked in ascending pixel-size order.
test('theme discovers any square apple-touch-icon variant, sorted by size', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'apple-touch-icon.png',
    'apple-touch-icon-180x180.png',
    'apple-touch-icon-120x120.png',
  ]);
  assert.match(links, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
  assert.match(
    links,
    /rel="apple-touch-icon" href="\/apple-touch-icon-120x120\.png" sizes="120x120"/,
  );
  assert.match(
    links,
    /rel="apple-touch-icon" href="\/apple-touch-icon-180x180\.png" sizes="180x180"/,
  );
  const order = [...links.matchAll(/apple-touch-icon-(\d+)x\d+\.png/g)].map(
    (m) => Number(m[1]),
  );
  assert.deepEqual(
    order,
    [120, 180],
    'sized apple-touch-icon variants are linked in ascending pixel-size order',
  );
});

// Discovery is limited to square NxN variants: a rectangular favicon-WxH.png is
// ignored, so only the square sibling is linked.
test('theme ignores a non-square favicon PNG variant', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon-16x32.png',
    'favicon-32x32.png',
  ]);
  assert.match(
    links,
    /rel="icon" href="\/favicon-32x32\.png" type="image\/png" sizes="32x32"/,
    'the square favicon variant is linked',
  );
  assert.doesNotMatch(
    links,
    /favicon-16x32\.png/,
    'the non-square favicon variant is ignored',
  );
});

// Zero-padded sizes, excluded by the sized-variants helper's regex; `040`
// collides with the decimal `32`.
test('theme ignores zero-padded favicon PNG variants', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'favicon-08x08.png',
    'favicon-040x040.png',
    'favicon-32x32.png',
  ]);
  assert.equal(
    links,
    '<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />\n',
    'decimal variant is linked once, zero-padded variants are ignored',
  );
});

// A sized apple-touch-icon variant stands on its own: it is linked with its
// sizes even when the unsized apple-touch-icon.png is absent.
test('theme links a sized apple-touch-icon without the unsized file', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'apple-touch-icon-180x180.png',
  ]);
  assert.match(
    links,
    /rel="apple-touch-icon" href="\/apple-touch-icon-180x180\.png" sizes="180x180"/,
    'the sized apple-touch-icon variant is linked',
  );
  assert.doesNotMatch(
    links,
    /href="\/apple-touch-icon\.png"/,
    'the absent unsized apple-touch-icon.png is not linked',
  );
});

// Discovery scans every file in static/, so unrelated assets (and non-matching
// favicon files) must be passed over without disturbing the variant scan for
// either prefix. Guards the empty-findRESubmatch path in the sized-variants
// helper, where `index ... 0` returns nil for a non-matching name.
test('theme ignores unrelated static files while discovering variants', () => {
  const links = buildSiteFavicons(undefined, 'http://localhost/', [
    'robots.txt',
    'logo.svg',
    'favicon.svg',
    'favicon-32x32.png',
    'apple-touch-icon-180x180.png',
  ]);
  assert.match(
    links,
    /rel="icon" href="\/favicon-32x32\.png" type="image\/png" sizes="32x32"/,
    'the square favicon variant is linked',
  );
  assert.match(
    links,
    /rel="apple-touch-icon" href="\/apple-touch-icon-180x180\.png" sizes="180x180"/,
    'the square apple-touch-icon variant is linked',
  );
  assert.doesNotMatch(
    links,
    /href="\/(robots\.txt|logo\.svg)"/,
    'unrelated static files are not linked',
  );
});

test('discovered favicons pick up a baseURL subpath via relURL', () => {
  const links = buildSiteFavicons(undefined, 'https://example.org/sub/path/', [
    'favicon.ico',
  ]);
  assert.match(links, /href="\/sub\/path\/favicon\.ico"/);
});

// Sanity check: a site-supplied partial is emitted and detected, so the
// assertion above can't silently pass on a broken detector or override hook.
test('site-supplied favicons partial is used', () => {
  const links = buildSiteFavicons('<link rel="icon" href="/favicon.ico" />\n');
  assert.match(links, /rel="icon"/);
});

// The user guide recommends `relURL` (with no leading slash) so favicon links
// stay correct under a `baseURL` subpath; a root-absolute href does not. See
// https://gohugo.io/functions/urls/relurl/#input-begins-with-a-slash.
test('relURL favicon links pick up a baseURL subpath', () => {
  const partial =
    '<link rel="icon" href="{{ "favicon.ico" | relURL }}" />\n' +
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n';
  const links = buildSiteFavicons(partial, 'https://example.org/sub/path/');
  assert.match(links, /href="\/sub\/path\/favicon\.ico"/);
  assert.match(links, /href="\/apple-touch-icon\.png"/);
});
