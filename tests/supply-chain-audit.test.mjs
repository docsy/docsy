// Committed supply-chain audit: proves, from the committed manifests,
// locks, .npmrc, Netlify config, and workflows alone, that the hardening
// invariants (#2700, #2702, #2712) still hold, so future integrity claims
// regenerate from this test instead of ad hoc audit runs. Fast and
// offline. Companion guards: the pinned list in
// scripts/suite-anchor.test.mjs.
//
// Boundary: the audit runs inside the npm toolchain it audits (npm-run
// PATH, script-shell, node itself), so a malicious package already in the
// lock could subvert this very run. That adversary passed cooldown and a
// bump review to get there: bump vetting and review are the boundary, and
// these checks are tamper-evident drift detection, not a sandbox.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

import { UNSAFE_HUGO_ENV } from '../scripts/rebuild-hugo-extended.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const readJSON = (relPath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));

const locks = {
  'package-lock.json': readJSON('package-lock.json'),
  'theme/package-lock.json': readJSON('theme/package-lock.json'),
};

const rootManifest = readJSON('package.json');

// A lock key outside node_modules/ is a workspace source directory, and a
// link entry must point back into one: local code, not a registry fetch.
// The workspaces test below pins the member list and binds each directory
// to its package name and canonical lock link.
const workspaceDirs = new Set(rootManifest.workspaces ?? []);

// Git deps allowed to bypass the npm registry: lock key -> reviewed
// owner/repo.
const gitDependencyRepos = {};

// Known-poisoned package@version pairs from the 2026-08 npm-worm campaign
// (Datadog Security Labs). A denylist only ever samples: the structural
// checks (registry + integrity, allowlists) are the load-bearing part.
// Refresh this list when intentionally updating dependencies.
const packageIocs = new Set([
  'keyv@6.0.0',
  '@cacheable/net@2.1.1',
  '@cacheable/node-cache@3.1.2',
  'cacheable@2.5.1',
  'flat-cache@6.1.24',
  'cacheable-request@13.0.20',
  '@cacheable/memory@2.2.1',
  'file-entry-cache@11.1.6',
  '@cacheable/utils@2.5.1',
  'cache-manager@7.2.10',
  'ecto@5.0.1',
]);

const lockEntries = (lock) =>
  Object.entries(lock.packages).filter(([key]) => key !== '');

// Deliberately duplicated from runner-lint.test.mjs: one regex line beats
// a cross-test-file import.
const altRunner = /\b(yarn|pnpm|bunx?|corepack)\b/;
// One home for the unsafe-installer-control names: the runtime helper
// exports the list; its unit test pins the content literally.
const unsafeHugoEnv = new Set(UNSAFE_HUGO_ENV);
const envLeavesInstallConfigUntouched = (key) => {
  const normalized = key.toUpperCase();
  return (
    !normalized.startsWith('NPM_CONFIG_') &&
    normalized !== 'HUGO' &&
    normalized !== 'NODE_OPTIONS' &&
    !unsafeHugoEnv.has(normalized)
  );
};

test('locks: every package is registry+integrity, workspace-local, or an allowlisted git pin', () => {
  let registryPackages = 0;
  for (const [lockPath, lock] of Object.entries(locks)) {
    for (const [key, pkg] of lockEntries(lock)) {
      const id = `${lockPath} ${key}`;
      if (!key.startsWith('node_modules/')) {
        assert.ok(workspaceDirs.has(key), `${id} is a workspace directory`);
      } else if (pkg.link) {
        // Only each member's one canonical node_modules/NAME link is a
        // workspace symlink; any other link (an alias key, a file: dep)
        // must not ride this branch.
        assert.ok(
          workspaceDirs.has(pkg.resolved) &&
            key ===
              `node_modules/${readJSON(`${pkg.resolved}/package.json`).name}`,
          `${id} is a workspace member's canonical link`,
        );
      } else if (key in gitDependencyRepos) {
        assert.match(
          pkg.resolved ?? '',
          new RegExp(
            `^git\\+ssh://git@github\\.com/${gitDependencyRepos[key]}\\.git#[0-9a-f]{40}$`,
          ),
          `${id} is commit-pinned to its reviewed repo`,
        );
      } else {
        assert.match(
          pkg.resolved ?? '',
          /^https:\/\/registry\.npmjs\.org\//,
          `${id} resolves to the npm registry`,
        );
        // Bind the entry to one registry identity: npm trusts the
        // URL-baked name, so a hand-edited entry could keep an
        // allowlisted key (the reserved-bin provider, say) while
        // fetching a different artifact; and an aliasing name field
        // must not diverge from the key-derived name.
        const keyName = key.slice(
          key.lastIndexOf('node_modules/') + 'node_modules/'.length,
        );
        assert.equal(
          pkg.resolved,
          `https://registry.npmjs.org/${keyName}/-/${keyName
            .split('/')
            .pop()}-${pkg.version}.tgz`,
          `${id} resolves to the tarball its key and version imply`,
        );
        assert.equal(
          pkg.name ?? keyName,
          keyName,
          `${id} name matches its key-derived package name`,
        );
        assert.match(
          pkg.integrity ?? '',
          /^sha512-[A-Za-z0-9+/]{86}==$/,
          `${id} carries a full sha512 integrity hash`,
        );
        registryPackages += 1;
      }
    }
  }
  assert.ok(registryPackages > 0, 'registry packages were audited');
});

test('locks: every package version is absent from the campaign IOC list', () => {
  assert.ok(packageIocs.size > 0, 'the IOC denylist has entries');
  let checked = 0;
  for (const [lockPath, lock] of Object.entries(locks)) {
    for (const [key, pkg] of lockEntries(lock)) {
      if (!key.includes('node_modules/') || !pkg.version) continue;
      // Both identities: the lock key names what's installed, pkg.name (npm
      // aliases) what it really is; a spoofed name field must not clear the
      // key-derived one.
      const keyName = key.slice(
        key.lastIndexOf('node_modules/') + 'node_modules/'.length,
      );
      for (const name of new Set([keyName, pkg.name ?? keyName])) {
        checked += 1;
        assert.ok(
          !packageIocs.has(`${name}@${pkg.version}`),
          `${lockPath} ${name}@${pkg.version} is absent from the IOC list`,
        );
      }
    }
  }
  assert.ok(checked > 0, 'locked package versions were audited');
});

test('locks and manifests: install scripts stay inventoried and version-pinned', () => {
  const withInstallScript = [];
  for (const [lockPath, lock] of Object.entries(locks)) {
    for (const [key, pkg] of lockEntries(lock)) {
      if (pkg.hasInstallScript) withInstallScript.push(`${lockPath} ${key}`);
    }
  }
  // A lock inventory, not an execution list: platform gating (os/cpu) is
  // metadata the package itself controls, so even entries that never
  // install on supported platforms are inventoried; each entry's reviewed
  // disposition lives in allowScripts below.
  assert.deepEqual(
    withInstallScript,
    [
      'package-lock.json node_modules/@parcel/watcher',
      'package-lock.json node_modules/hugo-extended',
      'package-lock.json node_modules/puppeteer',
    ],
    'locked install-script packages match the reviewed inventory',
  );

  // Allow entries are version-pinned so a bump's new (unreviewed) script
  // fails the scripts-enabled installs (install:safe's rebuild step,
  // approve:hugo) under strict-allow-scripts; the assertion names the fix
  // in the bump PR itself (#2712). Ordinary installs skip all scripts
  // (ignore-scripts, .npmrc) without consulting the allowlist, and a new
  // script-bearing package fails the inventory assertion above in CI.
  // Deny entries are unversioned: the answer is
  // false for every version, so a pin would only add bump churn.
  // puppeteer's postinstall (browser download) is deliberately denied:
  // the visual suite installs its browser on demand (install:browser).
  // @parcel/watcher is lock-only: an optional dep of the pure-JS sass
  // fallback that sass-embedded ships for platforms without a prebuilt
  // binary (none we run), so it never installs; denied for defense in
  // depth should the tree ever change.
  const lockedVersion = (name) =>
    locks['package-lock.json'].packages[`node_modules/${name}`].version;
  const { allowScripts } = readJSON('package.json');
  assert.deepEqual(
    allowScripts,
    {
      '@parcel/watcher': false,
      [`hugo-extended@${lockedVersion('hugo-extended')}`]: true,
      puppeteer: false,
    },
    'allowScripts covers exactly the locked install-script packages',
  );

  // npm takes a key's last assignment, so spot-checks can be reversed by
  // a later line, and any unpinned addition (node-options=--require …,
  // ignore-scripts=false) changes install behavior: pin the full
  // assignment set. Each setting's rationale lives beside it in .npmrc.
  assert.deepEqual(
    fs
      .readFileSync(path.join(repoRoot, '.npmrc'), 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#')),
    [
      'min-release-age=7',
      'strict-allow-scripts=true',
      'engine-strict=true',
      'ignore-scripts=true',
      'script-shell=bash',
      '@docsy:registry=https://registry.npmjs.org/',
    ],
    '.npmrc carries exactly the reviewed npm settings',
  );
  // npm resolves workspace config at the root, but --prefix/-C runs
  // suppress the workspace walk-up and read only the target directory's
  // .npmrc: theme (the prefix-install target: install:theme-deps,
  // _sync:theme-lock) carries a byte-identical mirror of the root file so
  // those runs keep the same posture (the .nvmrc-pair pattern,
  // toolchain-versions.test.mjs), while docsy.dev (no prefix installs)
  // stays absent so the root file remains its one home. On a mismatch:
  // cp .npmrc theme/.npmrc.
  assert.equal(
    fs.readFileSync(path.join(repoRoot, 'theme/.npmrc'), 'utf8'),
    fs.readFileSync(path.join(repoRoot, '.npmrc'), 'utf8'),
    'theme/.npmrc is a byte-identical mirror of the root .npmrc',
  );
  assert.ok(
    !fs.existsSync(path.join(repoRoot, 'docsy.dev/.npmrc')),
    'docsy.dev defers .npmrc to the workspace root',
  );
  // Close the lockfile set: npm prefers npm-shrinkwrap.json over
  // package-lock.json at an install root, and a lock added anywhere else
  // (docsy.dev, a new directory) would define an installable tree outside
  // every check above. Enumerate from git (tracked plus
  // untracked-unignored, dot-directories included; fs.globSync skips
  // dot-directories, a probed false-green), so unknown locations fail
  // closed; gitignored scratch and the nested public/ site repos are
  // exactly what the closure should ignore.
  const lsFiles = spawnSync(
    'git',
    [
      'ls-files',
      '-z',
      '--cached',
      '--others',
      // Only the repo's own .gitignore files: --exclude-standard would
      // also honor user-level ignores (~/.gitignore, core.excludesFile),
      // making the closure environment-dependent (probed: a global
      // package-lock.json ignore hid a planted stray lock).
      '--exclude-per-directory=.gitignore',
    ],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  assert.equal(lsFiles.status, 0, 'git ls-files enumerates the repo files');
  const lockfiles = lsFiles.stdout
    .split('\0')
    // Case-insensitive: Windows and default-macOS filesystems satisfy
    // npm's lowercase open with any casing, so an odd-cased committed
    // lock is live there; the canonical-set comparison below then
    // rejects any non-lowercase spelling.
    .filter((file) => /(^|\/)(package-lock|npm-shrinkwrap)\.json$/i.test(file))
    .sort();
  assert.deepEqual(
    lockfiles,
    Object.keys(locks).sort(),
    'the audited locks are the only lockfiles in the tree',
  );
});

// A git-spec denylist would miss npm's other non-registry forms (owner/repo
// shorthand, URLs, aliases): require the registry semver shape instead, so
// unknown bypass classes fail closed.
test('manifests: every dependency spec is a registry semver range', () => {
  let specs = 0;
  for (const relPath of [
    'package.json',
    'docsy.dev/package.json',
    'theme/package.json',
  ]) {
    const { dependencies = {}, devDependencies = {} } = readJSON(relPath);
    for (const [name, spec] of [
      ...Object.entries(dependencies),
      ...Object.entries(devDependencies),
    ]) {
      specs += 1;
      assert.match(
        spec,
        /^[~^]?\d/,
        `${relPath} ${name} uses a registry semver spec`,
      );
    }
  }
  assert.ok(specs > 0, 'manifest dependency specs were audited');
});

// Bootstrap and Font Awesome are the theme's deps (AGENTS.md, Monorepo
// layout); a root copy would shadow the theme's reviewed pin (the
// pre-#2747 update:dep installed exactly there).
test('manifests: theme-owned dependencies stay out of the root manifest', () => {
  const rootDeps = readJSON('package.json');
  for (const name of ['bootstrap', '@fortawesome/fontawesome-free']) {
    assert.ok(
      !(name in (rootDeps.dependencies ?? {})) &&
        !(name in (rootDeps.devDependencies ?? {})),
      `${name} is declared only by the theme`,
    );
  }
});

// npm ci validates the lock only where its ideal tree lands, so a nested
// override-violating copy, a dropped override, or the theme's override-free
// lock all pass it; and npm never says an override became unnecessary. When
// a parent changes its declared range, its row goes red: reassess, and drop
// the override (and the row) if the parent now resolves past the vulnerable
// versions.
const REVIEWED_OVERRIDES = {
  // GHSA-xcpc-8h2w-3j85
  'adm-zip': {
    spec: '^0.6.0',
    fixed: /^0\.6\.\d+$/,
    parent: 'hugo-extended',
    parentRange: '^0.5.17',
  },
  // GHSA-7w5x-hrqm-74c2
  'smol-toml': {
    spec: '^1.7.1',
    fixed: /^1\.(7\.[1-9]\d*|(?:[89]|[1-9]\d+)\.\d+)$/,
    parent: 'markdownlint-cli2',
    parentRange: '1.7.0',
  },
};

test('locks and manifests: security overrides are applied and still needed', () => {
  assert.deepEqual(
    rootManifest.overrides ?? {},
    Object.fromEntries(
      Object.entries(REVIEWED_OVERRIDES).map(([name, o]) => [name, o.spec]),
    ),
    'root overrides carries exactly the reviewed entries',
  );
  assert.equal(
    readJSON('theme/package.json').overrides,
    undefined,
    'theme manifest declares no overrides',
  );
  for (const [name, o] of Object.entries(REVIEWED_OVERRIDES)) {
    // Every copy in every lock, hoisted or nested: npm may leave a
    // vulnerable one under the parent's own node_modules, and the root
    // override doesn't reach the theme's standalone lock.
    const nodes = Object.entries(locks).flatMap(([lock, { packages }]) =>
      Object.keys(packages)
        .filter((k) => k.endsWith(`node_modules/${name}`))
        .map((k) => [`${lock} ${k}`, packages[k]]),
    );
    assert.ok(nodes.length > 0, `${name} is in a lock`);
    for (const [node, pkg] of nodes) {
      assert.match(pkg.version, o.fixed, `${node} carries the fix`);
    }
    const parent =
      locks['package-lock.json'].packages[`node_modules/${o.parent}`];
    assert.ok(parent, `${o.parent} is hoisted in the root lock`);
    assert.equal(
      parent.dependencies[name],
      o.parentRange,
      `${o.parent} declares the ${name} range that justifies the override`,
    );
  }
});

// Byte-exact reviewed forms of the scripts that hold install or
// script-approval authority, deliberately duplicating package.json: a
// property check would accept an appended rider on an opaque shell
// string. On a mismatch, adjudicate against the maintainer notes
// (Officially supported Hugo version, Dependency updates).
const REVIEWED_SCRIPTS = {
  // No --omit=optional: the Dart Sass compiler (sass-embedded) ships its
  // binary as platform-keyed optional packages, npm's script-free
  // platform-dispatch form; omitting optionals leaves no compiler.
  'install:safe': 'npm run _install:safe:pre && npm run _install:safe:post',
  '_install:safe:pre': 'npm ci --ignore-scripts --no-audit --no-fund',
  '_install:safe:post':
    'node scripts/rebuild-hugo-extended.mjs && npm run install:theme-deps',
  'install:theme-deps':
    'npm ci --prefix theme --ignore-scripts --omit=dev --omit=peer --no-audit --no-fund',
  'install:browser': 'node node_modules/puppeteer/install.mjs',
  // Explicit --allow-scripts-pin keeps the approval version-scoped
  // regardless of user npm config.
  'approve:hugo':
    'npm run _install:safe:pre && npm approve-scripts --allow-scripts-pin hugo-extended && npm run -s _test:supply-chain && npm run _install:safe:post',
  '_test:supply-chain': 'node --test tests/supply-chain-audit.test.mjs',
};

test('scripts: install and approval entries keep their reviewed forms', () => {
  const { scripts } = readJSON('package.json');
  for (const [name, form] of Object.entries(REVIEWED_SCRIPTS)) {
    assert.equal(scripts[name], form, `${name} keeps its reviewed form`);
  }
  // npm wraps every script in implicit pre<name>/post<name> hooks: a hook
  // sibling would run unreviewed code inside a reviewed chain. Kept
  // despite tests/npm-scripts.test.mjs's namespace ban: this loop honors
  // no reviewed-pair exemptions, so an allowlisted pair can never ride an
  // install-path name.
  for (const name of Object.keys(REVIEWED_SCRIPTS)) {
    for (const hook of [`pre${name}`, `post${name}`]) {
      assert.equal(
        scripts[hook],
        undefined,
        `${hook} is absent, so ${name} runs exactly as reviewed`,
      );
    }
  }
});

test('workspaces: the reviewed member set, bound identities, no shadow config', () => {
  // npm resolves config and the root lock at the workspace root; member
  // .npmrc files are governed by the mirror-or-absent assertions in the
  // install-scripts test above. A new member widens the audited install
  // surface, so the list itself is pinned. theme/package-lock.json is the
  // one sanctioned member lock: install:theme-deps consumes it as a
  // standalone prefix install (this file audits it in `locks`).
  const reviewedWorkspaces = {
    'docsy.dev': '@docsy/docsy.dev',
    theme: '@docsy/theme',
  };
  assert.deepEqual(
    rootManifest.workspaces,
    Object.keys(reviewedWorkspaces),
    'the workspace list matches the reviewed set',
  );
  const rootLock = locks['package-lock.json'];
  for (const [dir, name] of Object.entries(reviewedWorkspaces)) {
    const member = readJSON(`${dir}/package.json`);
    // Bind directory, package name, and the canonical lock link to one
    // identity: the lock filter in the registry test trusts only this
    // link key.
    assert.equal(member.name, name, `${dir} keeps its reviewed package name`);
    assert.equal(
      rootLock.packages[dir]?.name,
      name,
      `the root lock's ${dir} entry carries the member name`,
    );
    assert.deepEqual(
      rootLock.packages[`node_modules/${name}`],
      { resolved: dir, link: true },
      `the root lock links node_modules/${name} to ${dir} and nothing else`,
    );
    // npm runs a member's install-lifecycle scripts as project code, not
    // as dependency scripts, so allowScripts and strict-allow-scripts
    // never gate them; the binding.gyp screen below covers members too.
  }
});

test('locks: no package provides a bin that shadows a trusted command', () => {
  // npm links every package's bin entries into node_modules/.bin (even
  // under --ignore-scripts), and npm-run scripts put that directory
  // first on PATH. A bin named after a command the reviewed script
  // chains trust would hijack every later script step, so reserve those
  // names outright: the interpreters and VCS (node, npm, git, shells,
  // perl), npx (the smoke suite runs the sanctioned `npx --no` form
  // under npm-run PATH), hugo, and the external commands the production
  // Netlify chain reaches (cut, in _netlify:set-build-id). Runner names
  // nothing invokes (yarn, pnpm, corepack) need no reservation, and the
  // dev/test lanes' external-command closure (tar, patch, cp, ...) is
  // unbounded and stays review's: reserving it would be baseline without
  // end.
  const reservedBins = new Set([
    'node',
    'npm',
    'npx',
    'git',
    'bash',
    'sh',
    'perl',
    'cut',
    'hugo',
  ]);
  // The one reviewed (provider, name) pair: docsy's hugo scripts resolve
  // `hugo` through node_modules/.bin by design.
  const reservedBinAllow = new Set(['node_modules/hugo-extended hugo']);
  let binNames = 0;
  for (const [lockPath, lock] of Object.entries(locks)) {
    for (const [key, pkg] of lockEntries(lock)) {
      if (pkg.bin === undefined) continue;
      const id = `${lockPath} ${key}`;
      const keyName = key.slice(
        key.lastIndexOf('node_modules/') + 'node_modules/'.length,
      );
      let names;
      if (typeof pkg.bin === 'string') {
        names = [(pkg.name ?? keyName).split('/').pop()];
      } else {
        // Fail closed on non-canonical bin shapes: an array's keys are
        // its indices, and npm's normalize-package-bin links an object
        // key by basename(key.replace(/\\|:/g, '/')), so an array entry
        // or a path-shaped key (`bin/node`, `safe:node`) would slip past
        // a literal name compare.
        assert.ok(
          !Array.isArray(pkg.bin),
          `${id} bin is a name-to-path object`,
        );
        names = Object.keys(pkg.bin);
        for (const name of names) {
          assert.doesNotMatch(
            name,
            /[/\\:]/,
            `${id} bin key ${name} is a bare command name`,
          );
        }
      }
      for (const name of names) {
        binNames += 1;
        // Case-fold: npm preserves bin-key case, and macOS/Windows
        // filesystems resolve `node` to a shim named `Node`.
        const folded = name.toLowerCase();
        assert.ok(
          !reservedBins.has(folded) || reservedBinAllow.has(`${key} ${folded}`),
          `${id} bin ${name} leaves trusted command names unshadowed`,
        );
      }
    }
  }
  assert.ok(binNames > 0, 'lock bin entries were audited');
});

test('manifest: engines floor stays at or above the reviewed minimums', () => {
  // The npm floor is the oldest version trusted to enforce the controls
  // (strict allowScripts landed in 11.16; 11.18 fixes workspace
  // visibility under linked installs, npm/cli#9652); the floor only
  // rises. engine-strict (pinned in the .npmrc set above) makes npm
  // enforce the written floor at install time; these pins guard what
  // that mechanism can't know or can be disabled by.
  const { engines } = rootManifest;
  const npmFloor = engines.npm.match(/^>=(\d+)\.(\d+)\.(\d+)$/);
  assert.ok(npmFloor, 'engines.npm is a >=x.y.z floor');
  const [major, minor] = npmFloor.slice(1).map(Number);
  assert.ok(
    major > 11 || (major === 11 && minor >= 18),
    'engines.npm floor is at least 11.18',
  );
  // The lock captures engines at generation time; a floor raised in the
  // manifest without the reconcile run leaves the lock stale (npm ci's
  // sync check compares dependency specs, not engines).
  assert.deepEqual(
    locks['package-lock.json'].packages[''].engines,
    engines,
    'the root lock engines match the manifest',
  );
  // npm skips the root engines check entirely when devEngines is present
  // (@npmcli/arborist build-ideal-tree.js), so its absence is part of
  // the floor.
  assert.equal(
    rootManifest.devEngines,
    undefined,
    'devEngines is absent, so engine-strict enforces engines',
  );
});

test('manifests: the install surfaces stay unconfigured and hook-free', () => {
  // install:browser's entry point loads Puppeteer configuration from the project
  // (executable config files, a package.json "puppeteer" key), which can
  // redirect the browser download or swap the launched executable: the
  // audited install is only as locked as this search surface stays empty.
  // The search-place list is read from the installed loader, so an upgrade
  // that widens the surface turns this audit red.
  const loaderSrc = fs.readFileSync(
    path.join(
      repoRoot,
      'node_modules/puppeteer/lib/puppeteer/getConfiguration.js',
    ),
    'utf8',
  );
  const placesMatch = loaderSrc.match(/searchPlaces:\s*\[([^\]]*)\]/);
  assert.ok(placesMatch, 'the installed loader declares its search places');
  const searchPlaces = [...placesMatch[1].matchAll(/'([^']+)'/g)].map(
    (m) => m[1],
  );
  assert.ok(
    searchPlaces.includes('.config/puppeteerrc') && searchPlaces.length >= 12,
    'the parsed search-place list is plausibly complete',
  );
  for (const config of searchPlaces) {
    if (config === 'package.json') continue; // its puppeteer key is pinned below
    assert.ok(
      !fs.existsSync(path.join(repoRoot, config)),
      `${config} is absent, so the browser install runs unconfigured`,
    );
  }
  for (const manifest of ['package.json', 'theme', 'docsy.dev']) {
    const file = manifest.endsWith('.json')
      ? manifest
      : `${manifest}/package.json`;
    assert.equal(
      readJSON(file).puppeteer,
      undefined,
      `${file} puppeteer configuration key is absent`,
    );
  }
  // Cross-root anchoring: this file and the wiring guard ride the tests
  // glob, so scripts/suite-anchor.test.mjs pins that glob and the
  // tests-root guards from the scripts glob; anchor it and the wiring
  // guard back from here.
  for (const guard of [
    'scripts/suite-anchor.test.mjs',
    'tests/test-wiring.test.mjs',
  ]) {
    assert.ok(
      fs.existsSync(path.join(repoRoot, guard)),
      `structural guard ${guard} exists`,
    );
  }

  // Safe smoke predicts a permissive Docsy install only while permissive
  // installs add no consumer-facing lifecycle behavior. (The general
  // lifecycle-namespace ban over script names lives in
  // tests/npm-scripts.test.mjs.)
  for (const manifest of ['package.json', 'theme/package.json']) {
    const consumerScripts = readJSON(manifest).scripts ?? {};
    for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
      assert.equal(
        consumerScripts[hook],
        undefined,
        `${manifest} ${hook} is absent, so permissive installs run script-free`,
      );
    }
  }
  // With no explicit install script, a binding.gyp makes npm synthesize
  // `node-gyp rebuild` as the install script: for the root, and for
  // workspace members (whose install lifecycle runs as project code,
  // ungated by allowScripts).
  for (const dir of ['.', 'docsy.dev', 'theme']) {
    assert.ok(
      !fs.existsSync(path.join(repoRoot, dir, 'binding.gyp')),
      `${dir} binding.gyp is absent, so npm synthesizes no install script`,
    );
  }
});

test('workflows: installs are locked and credential-isolated', () => {
  const workflowsDir = path.join(repoRoot, '.github/workflows');
  const files = fs
    .readdirSync(workflowsDir)
    .filter((file) => /\.ya?ml$/.test(file));
  assert.ok(files.length > 0, 'workflow files were found');
  const netlifyConfig = fs.readFileSync(
    path.join(repoRoot, 'docsy.dev/netlify.toml'),
    'utf8',
  );
  // Netlify [build.environment] feeds the same install and build
  // processes the workflow env screen guards: screen every env-shaped key
  // the same way, and pin NPM_FLAGS exactly; it is what constrains
  // Netlify's automatic install to resolution only (its comment in
  // netlify.toml).
  let netlifyEnvKeys = 0;
  for (const [, key, value] of netlifyConfig.matchAll(
    /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/gm,
  )) {
    netlifyEnvKeys += 1;
    assert.ok(
      envLeavesInstallConfigUntouched(key),
      `Netlify env ${key} leaves npm, Node, and Hugo config untouched`,
    );
    if (key === 'NPM_FLAGS') {
      assert.equal(
        value,
        '"--dry-run --ignore-scripts"',
        'NPM_FLAGS constrains the Netlify auto-install to resolution only',
      );
    }
  }
  assert.ok(netlifyEnvKeys > 0, 'Netlify env keys were audited');
  // Netlify command chains are execution entry points the runner lint
  // doesn't scan (TOML): exact-pin them.
  assert.deepEqual(
    netlifyConfig
      .split('\n')
      .filter((line) => /^\s*command\s*=/.test(line))
      .map((line) => line.trim())
      .sort(),
    [
      'command = "npm run _netlify:prepare && npm run -C docsy.dev build:preview"',
      'command = "npm run _netlify:prepare && npm run -C docsy.dev build:production"',
    ].sort(),
    'Netlify build commands are the two reviewed chains',
  );

  let runSteps = 0;
  let checkouts = 0;
  let setupNodes = 0;
  let safeInstalls = 0;
  for (const file of files) {
    const workflow = parse(
      fs.readFileSync(path.join(workflowsDir, file), 'utf8'),
    );
    assert.equal(
      workflow.defaults?.run?.shell,
      undefined,
      `${file} uses the default workflow shell`,
    );
    for (const [jobId, job] of Object.entries(workflow.jobs ?? {})) {
      const id = `${file} ${jobId}`;
      // A stepless job (a reusable-workflow call, say) would escape this
      // scan; extend the audit deliberately instead.
      assert.ok(
        Array.isArray(job.steps),
        `${id} is a steps job this audit scans`,
      );
      // Mutable images run external code around every step, outside the
      // action-pin invariant.
      assert.equal(job.container, undefined, `${id} runs container-free`);
      assert.equal(job.services, undefined, `${id} runs service-free`);
      assert.equal(
        job.defaults?.run?.shell,
        undefined,
        `${id} uses the default job shell`,
      );
      // Env can invert the audited config: NPM_CONFIG_* outranks .npmrc,
      // the shell scripts honor a HUGO override, and NODE_OPTIONS injects
      // code into every Node process.
      for (const env of [workflow.env, job.env]) {
        for (const key of Object.keys(env ?? {})) {
          assert.ok(
            envLeavesInstallConfigUntouched(key),
            `${id} env ${key} leaves npm and Hugo config untouched`,
          );
        }
      }
      for (const step of job.steps) {
        for (const key of Object.keys(step.env ?? {})) {
          assert.ok(
            envLeavesInstallConfigUntouched(key),
            `${id} step env ${key} leaves npm and Hugo config untouched`,
          );
        }
        if (step.shell !== undefined) {
          assert.equal(
            step.shell,
            'bash',
            `${id} uses the reviewed bash shell`,
          );
        }
        // GitHub resolves action owner/repo case-insensitively, so
        // classify on the folded form: `Actions/checkout@` is the same
        // action and must not bypass the input pins below.
        const uses = step.uses?.toLowerCase();
        if (uses?.startsWith('actions/checkout@')) {
          checkouts += 1;
          assert.equal(
            step.with?.['persist-credentials'],
            false,
            `${id} checkout sets persist-credentials false`,
          );
        }
        // The engines floor holds in CI only while setup-node reads the
        // exact .nvmrc pin; a node-version input or another version file
        // (package.json resolves the floating engines range) silently
        // swaps the toolchain source. Consumption-side companion of the
        // pin-sync test in tests/toolchain-versions.test.mjs.
        if (uses?.startsWith('actions/setup-node@')) {
          setupNodes += 1;
          assert.equal(
            step.with?.['node-version-file'],
            '.nvmrc',
            `${id} setup-node reads the .nvmrc pin`,
          );
          assert.equal(
            step.with?.['node-version'],
            undefined,
            `${id} setup-node takes its version from .nvmrc alone`,
          );
        }
        // Local actions and unpinned refs run code this audit doesn't walk.
        if (step.uses) {
          assert.match(
            step.uses,
            /^[\w-]+\/[\w.-]+(\/[\w./-]+)?@[0-9a-f]{40}$/,
            `${id} uses a SHA-pinned marketplace action`,
          );
        }
        if (typeof step.run !== 'string') continue;
        runSteps += 1;
        // Splice continuations first: `npm\` + newline + `ci` is one
        // command.
        const run = step.run.replace(/\\\r?\n/g, ' ');
        // Deny npm's tree-reifying/executing subcommands in raw run
        // steps: the one sanctioned install is the reviewed install:safe
        // script, counted below. `npm run` wrappers resolve to reviewed
        // scripts, and `npm pack`/`npm publish`/`npm init` install
        // nothing (`npm audit fix` and `npm link` do).
        assert.doesNotMatch(
          run,
          /\bnpm\s+(install(-test|-ci-test|-clean)?|isntall(-clean)?|clean-install(-test)?|add|i|in|ins|inst|insta|instal|isnt|isnta|isntal|it|cit|sit|ic|ci|dedupe|ddp|update|up|upgrade|udpate|rebuild|rb|exec|x|audit|link|ln)\b/,
          `${id} run step installs only via reviewed npm scripts`,
        );
        assert.doesNotMatch(run, /\bnpx\b/, `${id} run step avoids npx`);
        assert.doesNotMatch(
          run,
          altRunner,
          `${id} run step uses npm as its only package manager`,
        );
        // GITHUB_ENV writes poison later steps' env past the map checks
        // above; pin the one reviewed use (the smoke scaffold path, a
        // static runner-temp location that later steps read as their
        // working directory).
        for (const line of run.split('\n')) {
          if (!line.includes('GITHUB_ENV')) continue;
          assert.equal(
            line.trim(),
            'echo "SCAFFOLD=$SCAFFOLD" >> "$GITHUB_ENV"',
            `${id} run step writes GITHUB_ENV only via the reviewed scaffold line`,
          );
          // The echo pin alone leaves $SCAFFOLD's value free; pin its
          // assignment to the reviewed runner-temp literal.
          assert.ok(
            run.includes('SCAFFOLD="$RUNNER_TEMP/docsy-smoke"'),
            `${id} sets SCAFFOLD to the reviewed runner-temp path`,
          );
        }
        // GITHUB_PATH prepends, so a writer could shadow npm itself; pin
        // its one reviewed use (the lychee install).
        for (const line of run.split('\n')) {
          if (!line.includes('GITHUB_PATH')) continue;
          assert.equal(
            line.trim(),
            'echo "$HOME/.local/bin" >> "$GITHUB_PATH"',
            `${id} run step writes GITHUB_PATH only via the reviewed lychee line`,
          );
        }
        safeInstalls += (run.match(/npm run install:safe\b/g) ?? []).length;
      }
    }
  }
  assert.ok(runSteps > 0, 'workflow run steps were audited');
  assert.ok(checkouts > 0, 'checkout steps were audited');
  assert.ok(setupNodes > 0, 'setup-node steps were audited');
  assert.ok(safeInstalls > 0, 'CI installs go through install:safe');
});
