// Smoke tests: builds a Docsy-based site several ways and asserts each produces
// a real, fully-styled site (not merely a zero exit code).
//
//   Usage: npm run test:smoke -- [options]
//   Options:
//     --repo <repo>    GitHub org+repo to fetch Docsy from.
//                      Format: GITHUB_USER/DOCSY_REPO. Fallback: docsy/docsy
//     --branch <branch>
//                      Docsy branch to fetch. Fallback: main
//
// When no flags are given and the current branch has a GitHub upstream other
// than main, that upstream (repo and branch) is used as the default target:
// the common case when smoke-testing a PR branch pushed to a fork.
//
// NOTE: slow and network-bound (npm + Hugo fetch from GitHub). Deliberately
// not named .test.mjs, keeping it out of the `test:repo` globs and CI, which
// must stay fast and offline.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const TMP = path.join(os.tmpdir(), 'docsy-smoke');
const MAKE_SITE = path.join(repoRoot, 'scripts', 'make-site.sh');
// Smoke sites build under the OS temp dir, outside the repo, so Node can't
// resolve the repo's own node_modules and mask a packaging gap. Only Hugo (the
// build tool, not a dependency under test) is borrowed from the repo install.
const HUGO_BIN = path.join(repoRoot, 'node_modules', '.bin', 'hugo');
const THEME_VERSION = JSON.parse(
  readFileSync(path.join(repoRoot, 'theme', 'package.json'), 'utf8'),
).version;
const SASS_VERSION = JSON.parse(
  readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
).devDependencies['sass-embedded'];
assert.match(
  SASS_VERSION ?? '',
  /^\d+\.\d+\.\d+[\w.+-]*$/,
  'the repo manifest carries an exact sass-embedded pin',
);

// One home for the age-gate remedy: a suite-owned knob, applied as a flag on
// the theme-package installs only (the exact, asserted artifact under test,
// plus its fresh dep pins). The generic npm knob is deliberately not used:
// scratch sites have no lockfile, so a run-wide relaxation would admit fresh
// transitive releases under the other pinned installs -- those stay under the
// operator's ambient npm config, untouched in either direction.
const AGE_GATE_REMEDY =
  'add DOCSY_THEME_MIN_RELEASE_AGE=N to your command, N = the release age in whole days (0 on release day): higher still blocks, lower over-relaxes; the suite applies it to the theme-package installs only';
// Load-time on purpose (unlike derivationError): a mistyped operator value
// should fail before any network work, and it concerns every theme install.
const ageGateOverride = process.env.DOCSY_THEME_MIN_RELEASE_AGE || undefined;
if (ageGateOverride !== undefined)
  assert.match(
    ageGateOverride,
    /^\d{1,4}$/,
    `DOCSY_THEME_MIN_RELEASE_AGE (${ageGateOverride}) is a whole number of days (at most 4 digits)`,
  );

// PATH for consumer-site Hugo builds: the site's own bin dir first, and this
// checkout's directories removed, so a consumer site missing its own sass
// compiler fails loud instead of silently borrowing the maintainer repo's
// (only Hugo is deliberately borrowed, via HUGO_BIN above).
function consumerEnv(site) {
  const cleaned = (process.env.PATH ?? '')
    .split(path.delimiter)
    .filter((dir) => !dir.startsWith(repoRoot))
    .join(path.delimiter);
  return {
    ...process.env,
    PATH: [path.join(site, 'node_modules', '.bin'), cleaned].join(
      path.delimiter,
    ),
  };
}

// The documented consumer action for the dartsass transpiler: the site
// provides its own sass compiler (Install Dart Sass, prerequisites doc) --
// at the repo's tested pin, so a fresh upstream sass release can't perturb
// the suite.
function installSiteSass(label, npmOpts) {
  progress(`${label}: npm install sass-embedded@${SASS_VERSION}…`);
  assert.equal(
    run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--save-dev',
        `sass-embedded@${SASS_VERSION}`,
      ],
      npmOpts,
    ).status,
    0,
    'sass-embedded installs',
  );
}

// Read a `--name value` or `--name=value` CLI flag (after the `--` that npm
// forwards), falling back to a default. Last occurrence wins, so a flag passed
// on the command line overrides one baked into the `test:smoke` npm script.
function arg(name, fallback) {
  let value = fallback;
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === `--${name}`) value = process.argv[i + 1] ?? value;
    else if (a.startsWith(`--${name}=`)) value = a.slice(name.length + 3);
  }
  return value;
}

// Default target: the GitHub upstream of the current branch, when it exists
// and isn't main; otherwise docsy/docsy main.
function gitUpstreamTarget() {
  const opts = { cwd: repoRoot, encoding: 'utf8' };
  const upstream = spawnSync(
    'git',
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
    opts,
  );
  if (upstream.status !== 0) return undefined;
  const [remote, ...rest] = upstream.stdout.trim().split('/');
  const branch = rest.join('/');
  if (!branch || branch === 'main') return undefined;
  const url = spawnSync('git', ['remote', 'get-url', remote], opts);
  const m = (url.stdout ?? '')
    .trim()
    .match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  if (url.status !== 0 || !m) return undefined;
  return { repo: m[1], branch };
}

const upstream = gitUpstreamTarget();
const REPO = arg('repo', upstream?.repo ?? 'docsy/docsy');
const BRANCH = arg('branch', upstream?.branch ?? 'main');
const TARGET = `repo "${REPO}", branch "${BRANCH}"`;

// npm and npx are .cmd shims on Windows, and .cmd files require a shell.
const winShell = process.platform === 'win32';

// All sites built here are scratch sites; an inherited HUGO_THEME (worktree
// checkouts) would override their pinned themes.
delete process.env.HUGO_THEME;

// Run a command; surface its output only on failure.
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    process.stderr.write(
      `\n$ ${cmd} ${args.join(' ')}\n${r.stdout ?? ''}${r.stderr ?? ''}\n`,
    );
  }
  return r;
}

function hugo(args, opts = {}) {
  return run(HUGO_BIN, args, opts);
}

// Stream a progress line via fd 2 directly: node:test buffers a test's console
// output until the test finishes, which would otherwise hide progress mid-build.
function progress(msg) {
  writeSync(2, `[smoke] ${msg}\n`);
}

// Assert a real, fully-styled build (not just a zero exit): a non-trivial
// compiled stylesheet that the home page actually links, plus a sitemap.
function assertBuilt(name) {
  const pub = path.join(TMP, name, 'public');

  const scssDir = path.join(pub, 'scss');
  const mainCss = existsSync(scssDir)
    ? readdirSync(scssDir).find((f) => /^main\.min.*\.css$/.test(f))
    : undefined;
  assert.ok(mainCss, 'compiled main.min.*.css exists');
  assert.ok(
    statSync(path.join(scssDir, mainCss)).size > 100_000,
    'compiled CSS is non-trivial (> 100 KB)',
  );

  const indexHtml = readFileSync(path.join(pub, 'index.html'), 'utf8');
  assert.match(
    indexHtml,
    /<title>[^<]+<\/title>/,
    'index.html has a rendered <title>',
  );
  assert.ok(
    indexHtml.includes(mainCss),
    'index.html links the compiled stylesheet',
  );

  const sitemap = readFileSync(path.join(pub, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /<urlset/, 'sitemap.xml is a <urlset>');
  assert.match(
    sitemap,
    /<loc>https?:\/\/[^<]+<\/loc>/,
    'sitemap.xml lists a page URL',
  );
}

before(() => {
  if (!existsSync(TMP)) mkdirSync(TMP);
  progress(`Target: ${TARGET}  (override with --repo / --branch)`);
  const v = hugo(['version']);
  assert.match(
    v.stdout ?? '',
    /extended/,
    'extended Hugo is installed (missing? run `npm run install:safe` at the repo root)',
  );
});

// An npm install of @docsy/theme wires the package bins into
// node_modules/.bin; assert the shim exists, then run it with the refusal
// form `npx --no` (an unrelated `gen-favicons` package exists on the
// public registry; rationale: tests/runner-lint.test.mjs).
function assertGenFaviconsBin(site) {
  assert.ok(
    existsSync(path.join(site, 'node_modules', '.bin', 'gen-favicons')),
    'gen-favicons bin shim is wired into node_modules/.bin',
  );
  progress('npx --no -- gen-favicons --help…');
  const help = run('npx', ['--no', '--', 'gen-favicons', '--help'], {
    cwd: site,
    shell: winShell,
  });
  assert.equal(help.status, 0, 'gen-favicons --help exits 0');
  assert.match(
    help.stdout ?? '',
    /Usage: gen-favicons/,
    'gen-favicons --help prints usage',
  );
}

// --- make-site.sh modes (mirror the CI smoke matrix) -----------------------
for (const src of ['NPM', 'HUGO_MODULE']) {
  test(`make-site.sh -s ${src}`, () => {
    const name = `smoke-${src.toLowerCase()}`;
    progress(`${src}: make-site (npm/Hugo fetch + build) from ${TARGET}…`);
    const r = run(
      'bash',
      [MAKE_SITE, '-s', src, '-r', REPO, '-v', BRANCH, '-f', '-n', name],
      { cwd: TMP, env: { ...process.env, HUGO: HUGO_BIN } },
    );
    assert.equal(r.status, 0, `${src} site build exited 0`);
    assertBuilt(name);
    if (src === 'NPM') assertGenFaviconsBin(path.join(TMP, name));
    progress(`${src}: ok`);
  });
}

// --- consumer installs of @docsy/theme --------------------------------------
// Install the theme-only package into a scratch site outside the repo and
// exercise the consumer contract: a styled build plus the wired gen-favicons
// bin. The tarball test packs theme/ from this checkout: the pre-publish
// check that covers the code under review. The npm-registry test installs a
// published spec: the post-publish check.

function buildThemeConsumerSite(name, themePkgSpec, expected) {
  const site = path.join(TMP, name);
  rmSync(site, { recursive: true, force: true });

  progress(`${name}: hugo new site…`);
  assert.equal(
    hugo(['new', 'site', '--format', 'yaml', '--quiet', site], { cwd: TMP })
      .status,
    0,
    'hugo new site',
  );

  progress(`${name}: npm install ${themePkgSpec}…`);
  const npmOpts = { cwd: site, shell: winShell };
  assert.equal(run('npm', ['init', '-y'], npmOpts).status, 0, 'npm init');
  // Pin which npm registry serves the scoped package, mirroring the root .npmrc
  // (its rationale comment): the expected version was resolved against npmjs,
  // so the install must not route through a user-configured mirror whose
  // same-version artifact could differ.
  writeFileSync(
    path.join(site, '.npmrc'),
    '@docsy:registry=https://registry.npmjs.org/\n',
  );
  const install = run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      // The granted override applies here only (rationale at AGE_GATE_REMEDY);
      // as a flag it outranks env-borne config. Load-bearing for both legs:
      // the tarball's path spec is ungated, but its fresh theme dep pins
      // resolve from the npm registry too.
      ...(ageGateOverride !== undefined
        ? [`--min-release-age=${ageGateOverride}`]
        : []),
      themePkgSpec,
    ],
    npmOpts,
  );
  // A fresh release is younger than a local min-release-age gate (which the
  // suite honors); map that failure -- identified by npm's date-cutoff
  // diagnostic, so other ETARGETs (broken pins) keep npm's own message -- to
  // the deliberate rerun.
  if (
    install.status !== 0 &&
    /ETARGET/.test(install.stderr ?? '') &&
    /with a date before/.test(install.stderr ?? '')
  ) {
    assert.fail(
      `${themePkgSpec} is installable (blocked by your npm min-release-age setting; the theme package or its dependency pins are the artifact under test, so vet it deliberately: ${AGE_GATE_REMEDY})`,
    );
  }
  assert.equal(install.status, 0, `${themePkgSpec} installs`);
  const installed = JSON.parse(
    readFileSync(
      path.join(site, 'node_modules', '@docsy', 'theme', 'package.json'),
      'utf8',
    ),
  ).version;
  progress(`${name}: installed @docsy/theme@${installed}`);
  // Assert before building: a redirected install would otherwise burn a full
  // build of the wrong version, whose own failure could mask this diagnostic.
  if (expected !== undefined) {
    assert.equal(
      installed,
      expected,
      `installed version matches the npm registry's resolution of ${themePkgSpec} (a mismatch usually means a local min-release-age gate redirected the install; ${AGE_GATE_REMEDY})`,
    );
  }
  installSiteSass(name, npmOpts);

  // The one-line consumer config change (@ must be quoted in YAML).
  appendFileSync(
    path.join(site, 'hugo.yaml'),
    "\ntheme: '@docsy/theme'\nthemesDir: node_modules\n",
  );
  progress(`${name}: hugo build…`);
  assert.equal(
    hugo([], { cwd: site, env: consumerEnv(site) }).status,
    0,
    'hugo build',
  );
  assertBuilt(name);
  assertGenFaviconsBin(site);
  progress(`${name}: ok`);
  return installed;
}

test('tarball install of @docsy/theme packed from this checkout', () => {
  const packDest = path.join(TMP, 'theme-pack');
  rmSync(packDest, { recursive: true, force: true });
  mkdirSync(packDest, { recursive: true });
  progress('tarball: npm pack theme/…');
  // Force the theme's own pack lifecycle (LICENSE copy, pack-stamp) so the
  // packed tarball matches what publish.yaml ships, under any npm config
  // (the repo .npmrc sets ignore-scripts=true). Safe: packing a local
  // directory installs nothing, so only this repo's own lifecycle runs.
  const pack = run(
    'npm',
    [
      'pack',
      '--ignore-scripts=false',
      '--pack-destination',
      packDest,
      '--silent',
    ],
    {
      cwd: path.join(repoRoot, 'theme'),
      shell: winShell,
    },
  );
  assert.equal(pack.status, 0, 'npm pack exits 0');
  const tgz = readdirSync(packDest).find((f) => f.endsWith('.tgz'));
  assert.ok(tgz, 'npm pack produced a tarball');
  const installed = buildThemeConsumerSite(
    'smoke-tarball',
    path.join(packDest, tgz),
  );
  // Dev versions pack with a build-ID stamp appended (scripts/pack-stamp.mjs);
  // releases and RCs pack unchanged, so only a -dev checkout may differ.
  assert.ok(
    installed === THEME_VERSION ||
      (THEME_VERSION.endsWith('-dev') &&
        installed.startsWith(`${THEME_VERSION}+`)),
    `packed theme version (${installed}) matches the checkout (${THEME_VERSION})`,
  );
});

// Npm-registry spec: an exact pin when the checkout is at a published release
// (stable manifest version whose git tag is an ancestor of HEAD: notes step
// 15.4, tolerating unrelated merges landing after the tag); a stable-stamped
// but untagged checkout is release prep pre-publish (notes step 8), where the
// version isn't on the npm registry yet, so `latest` gets vetted instead. The
// test resolves the spec's expected version npm-registry-side (npm view, ungated
// by min-release-age) and asserts the installed version matches, so a local
// age gate can't silently redirect any spec form to an older stable (the
// 0.17.0 release vet installed 0.16.0). DOCSY_THEME_PKG overrides the spec:
// e.g. @docsy/theme@next to vet an RC. `||`: an empty override means unset.
let derivationError;
const NPM_REGISTRY_PKG =
  process.env.DOCSY_THEME_PKG || derivedNpmRegistrySpec();
function derivedNpmRegistrySpec() {
  if (/^\d+\.\d+\.\d+$/.test(THEME_VERSION)) {
    const gitArgs = ['-C', repoRoot];
    // spawnSync, not run(): a nonzero exit is an expected answer for both
    // probes, not a failure to dump.
    const tag = spawnSync(
      'git',
      [
        ...gitArgs,
        'rev-parse',
        '-q',
        '--verify',
        `refs/tags/v${THEME_VERSION}`,
      ],
      { encoding: 'utf8' },
    );
    // Exit 1 (silent) is "no such tag" (pre-publish, or a clone without the
    // tag fetched); anything else is a checkout without usable git identity
    // (source archive, broken git), where a guessed target could vet the
    // wrong artifact. Recorded, not thrown: a load-time throw would abort the
    // file's five other tests.
    if (tag.status !== 0 && tag.status !== 1) {
      derivationError =
        'the release state of this checkout is determinable (git identity unavailable; name the target by adding DOCSY_THEME_PKG=@docsy/theme@VERSION to your command)';
      return '@docsy/theme@latest';
    }
    if (tag.status === 0) {
      const ancestor = spawnSync(
        'git',
        [...gitArgs, 'merge-base', '--is-ancestor', tag.stdout.trim(), 'HEAD'],
        { encoding: 'utf8' },
      );
      if (ancestor.status === 0) return `@docsy/theme@${THEME_VERSION}`;
      // Same status routing as the tag probe: only "not an ancestor" (1)
      // falls back; a fatal error must not silently redirect the vet.
      if (ancestor.status !== 1) {
        derivationError =
          'the release state of this checkout is determinable (git ancestry check failed; name the target by adding DOCSY_THEME_PKG=@docsy/theme@VERSION to your command)';
        return '@docsy/theme@latest';
      }
    }
    progress(
      `npm registry: ${THEME_VERSION} is stamped but its tag is ${
        tag.status === 0
          ? 'not in this history'
          : `not in this clone (pre-publish, or tags unfetched; if ${THEME_VERSION} is published, fetch tags or set DOCSY_THEME_PKG)`
      }; vetting latest`,
    );
  }
  return '@docsy/theme@latest';
}
test(`npm-registry install of ${NPM_REGISTRY_PKG}`, () => {
  if (derivationError) assert.fail(derivationError);
  // The vet targets the npm-registry package, optionally pinned by exact
  // version or dist-tag: a path, foreign-package, or range override would
  // test something other than what it reports, and on Windows the spec
  // reaches npm through a shell (winShell), so metacharacters stay out.
  assert.match(
    NPM_REGISTRY_PKG,
    /^@docsy\/theme(@(\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?|[A-Za-z][\w.-]*))?$/,
    `DOCSY_THEME_PKG (${NPM_REGISTRY_PKG}) is the @docsy/theme npm-registry package, with an optional exact-version or dist-tag pin`,
  );
  // The expectation must come from the npm registry itself, so the view runs
  // against a fresh, empty cache: a miss can't be served stale (under an
  // offline config it fails loudly), whereas --prefer-online is a no-op here
  // (view already prefers online) and loses to ambient offline/prefer-offline
  // config, and a warm cache serves stale-if-error even online. The install
  // keeps the shared cache: a stale install can't match a fresh expectation.
  const viewCache = mkdtempSync(path.join(TMP, 'view-cache-'));
  const view = run(
    'npm',
    ['view', `--cache=${viewCache}`, NPM_REGISTRY_PKG, 'version'],
    {
      cwd: repoRoot,
      shell: winShell,
    },
  );
  rmSync(viewCache, { recursive: true, force: true });
  const expected = (view.stdout ?? '').trim();
  if (view.status !== 0 || !expected) {
    assert.fail(
      `${NPM_REGISTRY_PKG} resolves on the npm registry (view failed: registry unreachable, or for a fresh release, check that the npm publish landed: maintainer notes step 15)`,
    );
  }
  // Range-ish specs make npm view emit labeled multi-line output; fail here,
  // where the cause is visible, rather than at the version equality.
  assert.match(
    expected,
    /^\d+\.\d+\.\d+\S*$/,
    `${NPM_REGISTRY_PKG} resolves to a single version (got: ${expected})`,
  );
  // A prerelease checkout names the artifact just published (manual RC flow);
  // any other resolution, a bare run's `latest` included, would vet the wrong
  // artifact. A -dev checkout can't anchor this (the RC stamp is uncommitted
  // and restored post-publish); the notes have the driver eyeball the
  // expecting line.
  if (/^\d+\.\d+\.\d+-/.test(THEME_VERSION) && !THEME_VERSION.endsWith('-dev'))
    assert.equal(
      expected,
      THEME_VERSION,
      `${NPM_REGISTRY_PKG} resolves to this prerelease checkout's version (vet the prerelease explicitly by adding DOCSY_THEME_PKG=@docsy/theme@next to your command; a stale dist-tag vets the wrong artifact)`,
    );
  progress(`smoke-npm-registry: expecting @docsy/theme@${expected}`);
  buildThemeConsumerSite('smoke-npm-registry', NPM_REGISTRY_PKG, expected);
});

// --- declared minimum Hugo version actually builds --------------------------
// Pins Hugo to the theme's declared minimum (module.hugoVersion.min) and
// builds the Hugo-module-mode site, the most version-sensitive path: on
// sub-minimum Hugo versions, `hugo mod npm pack` emits empty deps and the build
// breaks, historically even silently (exit 0, unstyled site), the failure
// class that assertBuilt() exists to catch.
test('minimum Hugo version builds the HUGO_MODULE site', () => {
  // Extraction regex duplicated from tests/toolchain-versions.test.mjs (the
  // version sync suite) so each suite runs standalone; sync changes there.
  const min = readFileSync(
    path.join(repoRoot, 'theme', 'hugo.yaml'),
    'utf8',
  ).match(/^\s*hugoVersion:\s*\n(?:\s+extended:.*\n)?\s+min:\s*(\S+)/m)?.[1];
  assert.ok(min, 'theme/hugo.yaml declares module.hugoVersion.min');

  // Cached across runs under TMP.
  const minHugo = path.join(TMP, `hugo-${min}`, 'node_modules', '.bin', 'hugo');
  if (!existsSync(minHugo)) {
    progress(`min-hugo: npm install hugo-extended@${min}…`);
    const dir = path.join(TMP, `hugo-${min}`);
    mkdirSync(dir, { recursive: true });
    const install = run(
      'npm',
      ['install', '--no-audit', '--no-fund', `hugo-extended@${min}`],
      { cwd: dir },
    );
    assert.equal(install.status, 0, `hugo-extended@${min} installs`);
  }
  assert.match(
    run(minHugo, ['version']).stdout ?? '',
    new RegExp(`v${min.replaceAll('.', '\\.')}(?!\\d).*extended`),
    `scratch Hugo is extended v${min}`,
  );

  const name = 'smoke-min-hugo';
  progress(
    `min-hugo: make-site -s HUGO_MODULE with Hugo v${min} from ${TARGET}…`,
  );
  const r = run(
    'bash',
    [
      MAKE_SITE,
      '-s',
      'HUGO_MODULE',
      '-r',
      REPO,
      '-v',
      BRANCH,
      '-f',
      '-n',
      name,
    ],
    { cwd: TMP, env: { ...process.env, HUGO: minHugo } },
  );
  assert.equal(r.status, 0, `min-Hugo site build exited 0`);
  assertBuilt(name);
  progress('min-hugo: ok');
});

// --- non-module clone into themes/docsy/ (no CI smoke coverage otherwise) ---
test('non-module clone into themes/docsy', () => {
  const name = 'smoke-clone';
  const site = path.join(TMP, name);
  rmSync(site, { recursive: true, force: true });

  progress('clone: hugo new site…');
  assert.equal(
    hugo(['new', 'site', '--format', 'yaml', '--quiet', site], { cwd: TMP })
      .status,
    0,
    'hugo new site',
  );
  const themesDocsy = path.join(site, 'themes', 'docsy');
  progress(`clone: git clone ${TARGET} into themes/docsy…`);
  assert.equal(
    run('git', [
      'clone',
      '-b',
      BRANCH,
      '--depth',
      '1',
      `https://github.com/${REPO}`,
      themesDocsy,
    ]).status,
    0,
    'git clone theme into themes/docsy',
  );

  progress('clone: npm run install:theme-deps in themes/docsy…');
  assert.equal(
    run('npm', ['run', '--prefix', themesDocsy, 'install:theme-deps'], {})
      .status,
    0,
    'install theme deps etc',
  );

  const npmOpts = { cwd: site, shell: winShell };
  assert.equal(run('npm', ['init', '-y'], npmOpts).status, 0, 'npm init');
  installSiteSass('clone', npmOpts);

  appendFileSync(path.join(site, 'hugo.yaml'), '\ntheme: docsy/theme\n');
  progress('clone: hugo build…');
  assert.equal(
    hugo([], { cwd: site, env: consumerEnv(site) }).status,
    0,
    'hugo build',
  );
  assertBuilt(name);
  progress('clone: ok');
});
