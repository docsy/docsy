// Visual goldens for chrome regions: pixel-compares element crops of the
// fixture site against committed, platform-keyed goldens. Catches the CSS
// side of the semantic-classes migration (docsy#783), which the
// markup goldens can't see: a class swap whose styles fail to follow shows
// up here as a pixel diff while the markup diff stays clean.
//
// Platform policy and refresh flows: tests/visual/README.md.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { buildFixture } from '../fixture-site/lib/markup-goldens.mjs';
import {
  compareToGolden,
  launchBrowser,
  serveDir,
  shootRegion,
} from './lib/harness.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const goldenDir = path.join(here, 'goldens', process.platform);
const outDir = path.resolve(here, '../../tmp/visual');
const update = !!process.env.UPDATE_VISUAL_GOLDENS;

// Update mode in CI would write goldens instead of comparing and exit 0:
// a silent bypass of the authoritative net. GITHUB_ACTIONS is checked
// because CI is mutable from a workflow step; GITHUB_-prefixed vars are
// not.
if (update && (process.env.CI || process.env.GITHUB_ACTIONS)) {
  throw new Error('update mode is refused in CI');
}

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 667 },
};

// One entry per golden-tracked region; grows with the migration. The
// single-crumb variant is display:none (no element box), so the home of
// its visual proof is the docs/ page shot.
const regions = [
  {
    name: 'breadcrumb',
    path: 'docs/getting-started/install/',
    selector: 'nav[aria-label="breadcrumb"]',
  },
  {
    name: 'breadcrumb-mid',
    path: 'docs/getting-started/',
    selector: 'nav[aria-label="breadcrumb"]',
  },
  { name: 'page', path: 'docs/getting-started/install/' },
  { name: 'page-single', path: 'docs/' },
  // Term page: _taxonomy.scss couples article-teaser styling to breadcrumb
  // classes; only a term shot can see that mapping regress.
  { name: 'page-term', path: 'tags/setup/' },
  { name: 'page-blog', path: 'blog/first-post/' },
  // Print media: _breadcrumb.scss hides breadcrumbs in print; no screen
  // shot can see that rule regress.
  { name: 'page-print', path: 'docs/getting-started/install/', media: 'print' },
];

const shots = regions.flatMap((region) =>
  Object.entries(viewports).flatMap(([viewportName, viewport]) =>
    ['light', 'dark'].map((scheme) => ({
      name: `${region.name}-${viewportName}-${scheme}`,
      // Golden path: one subfolder per region, so the set stays browsable
      // as the migration adds regions.
      rel: path.join(region.name, `${viewportName}-${scheme}.png`),
      region,
      viewport,
      scheme,
    })),
  ),
);

let server, browser;
let compared = 0;

// A missing golden dir must fail loud on the authoritative platforms, not
// skip: all-skipped exits 0, so the skip path would let a PR delete the
// goldens and stay green.
const authoritative =
  process.platform === 'linux' ||
  !!process.env.CI ||
  !!process.env.GITHUB_ACTIONS;
const optedOut = !update && !authoritative && !existsSync(goldenDir);

before(async () => {
  if (optedOut) return;
  // Own fixture name: buildSite starts by wiping its directory, so sharing
  // markup-golden's would race a concurrent test:repo run. Resources are
  // retained as each settles: with Promise.all, a browser-launch rejection
  // would strand the already-listening server and hang the run.
  const build = buildFixture('visual-goldens');
  server = await serveDir(path.join(build.site, 'public'));
  browser = await launchBrowser();
});

after(async () => {
  await Promise.all([browser?.close(), server?.close()]);
  // Execution guard: filename bijection can't see quarantined (skipped)
  // shot tests; on the authoritative platform every comparison must
  // actually have run.
  if (!update && !optedOut && authoritative) {
    assert.equal(compared, shots.length, 'every shot comparison executed');
  }
});

// Comparator self-test: pixelmatch's default antialiasing detection
// excludes AA-classified pixels from the count, so a non-identical pair
// could report a clean match at threshold 0. Pin that a one-pixel,
// AA-classified difference is a failure (the bit-exact contract).
test('visual comparator: an antialiasing-classified pixel diff fails', () => {
  const golden = new PNG({ width: 5, height: 5 });
  const actual = new PNG({ width: 5, height: 5 });
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const i = (y * 5 + x) * 4;
      const v = x < 2 ? 0 : x > 2 ? 255 : 128; // gradient flags center as AA
      for (const png of [golden, actual]) {
        png.data.fill(v, i, i + 3);
        png.data[i + 3] = 255;
      }
    }
  }
  const center = (2 * 5 + 2) * 4;
  actual.data.fill(96, center, center + 3);
  // Own scratch dir: outDir is uploaded as the visual-diffs artifact, and
  // the Linux updater maps its *-actual.png files onto goldens.
  const scratch = path.resolve(here, '../../tmp/visual-selftest');
  mkdirSync(scratch, { recursive: true });
  const goldenFile = path.join(scratch, 'aa-golden.png');
  writeFileSync(goldenFile, PNG.sync.write(golden));
  assert.ok(
    compareToGolden('aa-self-test', actual, goldenFile, scratch),
    'a one-pixel antialiasing-classified difference is reported',
  );
});

for (const { name, rel, region, viewport, scheme } of shots) {
  test(
    `visual golden: ${name}`,
    {
      skip:
        optedOut &&
        `no ${process.platform} goldens; see tests/visual/README.md`,
    },
    async () => {
      const actual = await shootRegion(browser, {
        url: `${server.origin}/${region.path}`,
        selector: region.selector,
        viewport,
        scheme,
        media: region.media,
      });
      const file = path.join(goldenDir, rel);
      if (update) {
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, PNG.sync.write(actual));
        console.log(`wrote ${path.relative(process.cwd(), file)}`);
        return;
      }
      const failure = compareToGolden(name, actual, file, outDir);
      compared += 1;
      assert.equal(failure, null, `${name} matches its golden`);
    },
  );
}

// Structural guard: the golden set mirrors the shot list exactly, so a
// deleted golden, an emptied region list, or a stale extra file fails loud.
test(
  'visual goldens: golden files match the shot list',
  { skip: optedOut && 'no local goldens' },
  () => {
    assert.ok(shots.length > 0, 'shot list is non-empty');
    if (update) return;
    const tracked = shots.map(({ rel }) => rel).sort();
    const committed = readdirSync(goldenDir, { recursive: true })
      .filter((f) => f.endsWith('.png'))
      .sort();
    assert.deepEqual(
      committed,
      tracked,
      `goldens/${process.platform}/ matches the shot list`,
    );
  },
);
