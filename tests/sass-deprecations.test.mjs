// Guards the docsy#2731 outcome: Docsy's own Sass sources emit no
// deprecation warnings beyond the tolerated import class. Hugo builds
// silence these warnings (see maintainer notes, "Sass deprecation
// warnings"), so the probe compiles the theme directly with the pinned
// dart-sass, verbose so warning dedup can't hide occurrences. Loading a
// file does not evaluate its conditional branches, so the probe compiles
// every combination of the supported Boolean flags (the fixture matrix
// below; the guarantee covers these configurations, not arbitrary
// conditional shapes).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileAsync } from 'sass-embedded';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const themeScss = path.join(repoRoot, 'theme', 'assets', 'scss');
const vendors = {
  bootstrap: path.join(repoRoot, 'theme', 'node_modules', 'bootstrap'),
  'Font-Awesome': path.join(
    repoRoot,
    'theme',
    'node_modules',
    '@fortawesome',
    'fontawesome-free',
  ),
};

// Compile a copy of the theme tree laid out as Hugo mounts it (scss/ and
// vendor/ as siblings). `stubs`, when given, overwrites the project stub
// files; null keeps the repo's stock (comment-only) stubs.
async function compileTheme(stubs) {
  const tmpBase = path.join(repoRoot, 'tmp');
  fs.mkdirSync(tmpBase, { recursive: true });
  const dir = fs.realpathSync(
    fs.mkdtempSync(path.join(tmpBase, 'sass-deprecations-')),
  );
  try {
    const scssDir = path.join(dir, 'scss');
    fs.cpSync(themeScss, scssDir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'vendor'));
    for (const [name, target] of Object.entries(vendors)) {
      // Junction type: works without privileges on Windows CI; ignored on
      // other platforms.
      fs.symlinkSync(target, path.join(dir, 'vendor', name), 'junction');
    }
    const stubUrls = new Set();
    if (stubs) {
      for (const [file, content] of [
        ['_variables_project.scss', stubs.variables],
        ['_styles_project.scss', stubs.styles],
      ]) {
        const stubPath = path.join(scssDir, file);
        fs.writeFileSync(stubPath, content);
        stubUrls.add(pathToFileURL(stubPath).href);
      }
    }

    const warnings = [];
    // sass-embedded's sync API emulates blocking over a worker: slower, and it
    // broke under Node 24.22 (sass/embedded-host-node#451).
    const result = await compileAsync(path.join(scssDir, 'main.scss'), {
      verbose: true,
      logger: {
        warn(_message, opts) {
          warnings.push({
            deprecation: opts.deprecation,
            id: opts.deprecationType?.id ?? null,
            url: opts.span?.url?.href ?? null,
          });
        },
      },
    });
    const loaded = new Set(result.loadedUrls.map((u) => u.href));
    const unreached = fs
      .readdirSync(path.join(scssDir, 'td'), { recursive: true })
      .filter((f) => f.endsWith('.scss'))
      .map((f) => pathToFileURL(path.join(scssDir, 'td', f)).href)
      .filter((u) => !loaded.has(u));
    return { warnings, loadedCount: loaded.size, unreached, scssDir, stubUrls };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Fixture matrix: every combination of the supported Boolean flags
// ($td-enable-google-fonts defaults false, Bootstrap's $enable-dark-mode
// defaults true). `maximal` adds the full opt-in import surface so every
// partial compiles somewhere; `default` keeps the repo's stock stubs.
const fixtures = {
  default: null,
  'dark-off': { variables: '$enable-dark-mode: false;\n', styles: '' },
  'fonts-on': {
    variables: '$td-enable-google-fonts: true;\n$enable-dark-mode: false;\n',
    styles: '',
  },
  maximal: {
    variables: '$td-enable-google-fonts: true;\n$enable-dark-mode: true;\n',
    styles: [
      "@import 'td/extra/index';",
      "@import 'td/extra/bs-defaults';",
      "@import 'td/color-adjustments-dark';",
      "@import 'td/code-dark';",
      "@import 'td/gcs-search-dark';",
      // Exercises the one mixin branch no in-tree call reaches
      // (link-variant's $underline defaults false everywhere).
      "@include link-variant('.td-probe-underline', $red, $blue, true);",
      '',
    ].join('\n'),
  },
};

test('Docsy Sass sources emit no non-import deprecation warnings', async (t) => {
  const offending = [];
  let importSeen = false;
  for (const [name, stubs] of Object.entries(fixtures)) {
    const { warnings, loadedCount, unreached, scssDir, stubUrls } =
      await compileTheme(stubs);
    const scssUrl = pathToFileURL(scssDir + path.sep).href;
    for (const w of warnings) {
      // Shipped-source scope: every staged theme file (main.scss and the
      // root partials included) except the fixture-written stubs, whose
      // synthetic @imports must satisfy neither the canary nor the filter.
      if (!w.deprecation || !w.url?.startsWith(scssUrl)) continue;
      if (stubUrls.has(w.url)) continue;
      if (w.id === 'import') importSeen = true;
      else offending.push({ fixture: name, id: w.id, url: w.url });
    }
    if (name === 'maximal') {
      // Sanity: this fixture's opt-in stubs compile the whole Docsy tree, so
      // no partial escapes the guard.
      assert.deepEqual(
        unreached,
        [],
        'every theme Sass partial is loaded by the maximal fixture',
      );
    }
    t.diagnostic(
      `${name}: ${warnings.length} warnings, ${loadedCount} loaded files`,
    );
  }

  // Sanity: origin attribution provably works (Docsy's own import-class
  // warnings exist). When the @use refactor (docsy#2732) zeroes the import
  // class, this goes red: tighten the probe to "no Docsy warnings at all".
  assert.ok(
    importSeen,
    'warning attribution resolves Docsy-origin (import-class) warnings',
  );

  assert.deepEqual(
    offending,
    [],
    'Docsy Sass sources are free of non-import deprecation warnings',
  );
});
