// Docsy's version declarations must stay consistent, among themselves and with
// the versions that blog posts freeze (maintainer notes, "Hugo versions",
// "Dependency updates", and "Content placement"). Fast and offline.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

import { STABLE_SEMVER } from '../scripts/update-dep.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/** Extract the first regex capture from a file, asserting a match. */
function extract(relPath, re, what) {
  const text = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
  const m = text.match(re);
  assert.ok(m, `${what} is declared in ${relPath}`);
  return m[1];
}

// First entry is the canonical min-version home; assertInSync anchors on it.
const declarations = {
  'theme/hugo.yaml': () =>
    extract(
      'theme/hugo.yaml',
      /^\s*hugoVersion:\s*\n(?:\s+extended:.*\n)?\s+min:\s*(\S+)/m,
      'module.hugoVersion.min',
    ),
  'theme/theme.toml': () =>
    extract('theme/theme.toml', /^min_version\s*=\s*"([^"]+)"/m, 'min_version'),
  'docsy.dev/config/_default/hugo.yaml': () =>
    extract(
      'docsy.dev/config/_default/hugo.yaml',
      /^\s*hugoMinVersion:\s*&hugoMinVersion\s+(\S+)/m,
      'params.hugoMinVersion',
    ),
};

const readJSON = (relPath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));

const pin = () => readJSON('package.json').devDependencies['hugo-extended'];

function assertInSync(entries, what) {
  const values = Object.entries(entries).map(([file, get]) => {
    const value = get();
    assert.match(value, STABLE_SEMVER, `${file} ${what} is X.Y.Z semver`);
    return [file, value];
  });
  const [refFile, reference] = values[0];
  for (const [file, value] of values) {
    assert.equal(value, reference, `${file} ${what} matches ${refFile}`);
  }
  return reference;
}

test('Hugo minimum-version literal declarations are in sync', () => {
  assertInSync(declarations, 'minimum');
});

// Two homes by platform constraint: workflows and nvm read the root file,
// while Netlify reads only its base directory's (docsy.dev), with no root
// fallback. Exact pins, so every consumer resolves the same Node; upward
// skew between the two would pass engine-strict on both sides and split
// CI from Netlify silently.
test('Node toolchain pins (.nvmrc) are exact and in sync', () => {
  // Whole-file reads: a second version token would make consumers
  // disagree about the pin while a first-line extract stays green.
  const nvmrcPin = (relPath) => () =>
    extract(relPath, /^(\S+)\n?$/, 'the Node pin');
  assertInSync(
    {
      '.nvmrc': nvmrcPin('.nvmrc'),
      'docsy.dev/.nvmrc': nvmrcPin('docsy.dev/.nvmrc'),
    },
    'Node pin',
  );
});

// docsy.dev's own module.hugoVersion.min must relay the params value via the
// YAML anchor, not restate it (which could then drift silently).
test('docsy.dev module Hugo minimum aliases the params anchor', () => {
  const text = fs.readFileSync(
    path.join(repoRoot, 'docsy.dev/config/_default/hugo.yaml'),
    'utf8',
  );
  assert.match(
    text,
    /^\s*hugoVersion:\s*\n(?:\s+extended:.*\n)?\s+min: \*hugoMinVersion$/m,
    'module.hugoVersion.min references the &hugoMinVersion anchor',
  );
});

test('Hugo minimum is at most the officially supported version', () => {
  const minimum = declarations['theme/hugo.yaml']();
  const supported = pin();
  assert.match(supported, STABLE_SEMVER, 'hugo-extended pin is X.Y.Z semver');
  const toParts = (v) => v.split('.').map(Number);
  const cmp = toParts(minimum)
    .map((n, i) => n - toParts(supported)[i])
    .find((d) => d !== 0);
  assert.ok((cmp ?? 0) <= 0, `minimum ${minimum} <= pin ${supported}`);
});

const blogDir = path.join(repoRoot, 'docsy.dev/content/en/blog');
const blogPosts = () =>
  fs.readdirSync(blogDir, { recursive: true }).filter((f) => f.endsWith('.md'));
const frontMatterOf = (text) => text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

// A bare param name resolves only as a top-level front-matter field or a
// direct child of `params:`.
const pageParamOf = (frontMatter, param) => {
  const fm = parse(frontMatter) ?? {};
  const value = fm[param] ?? fm.params?.[param];
  return value === undefined ? undefined : String(value);
};

// Script-dependency pins (maintainer notes, "Default script-dependency
// versions").
const themeParams = () =>
  parse(fs.readFileSync(path.join(repoRoot, 'theme/hugo.yaml'), 'utf8')).params;
const scriptPin = (get) => () => {
  const value = get(themeParams());
  assert.ok(value, 'script pin is declared in theme/hugo.yaml');
  return String(value);
};

// Post version params, each mapped to its live declaration.
const liveVersions = {
  hugoMinVers: declarations['theme/hugo.yaml'],
  hugoSupportedVers: pin,
  sassEmbeddedVers: () =>
    readJSON('package.json').devDependencies['sass-embedded'],
  katexVers: scriptPin((p) => p.katex?.version),
  redocVers: scriptPin((p) => p.redoc?.version),
  mermaidVers: scriptPin((p) => p.docsy?.plugins?.mermaid?.version),
  markmapVers: scriptPin((p) => p.docsy?.plugins?.markmap?.version),
};

// Maintainer notes, "Content placement".
test('frozen version params have no site-param fallback', () => {
  const configDir = path.join(repoRoot, 'docsy.dev/config');
  const siteParams = fs
    .readdirSync(configDir, { recursive: true })
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => path.join(configDir, f))
    .concat(path.join(repoRoot, 'theme/hugo.yaml'))
    .flatMap((file) => {
      const config = parse(fs.readFileSync(file, 'utf8')) ?? {};
      if (file.endsWith('params.yaml')) return Object.keys(config);
      // Language params are site params too.
      const languages = Object.values(config.languages ?? {});
      return [config.params, ...languages.map((l) => l?.params)].flatMap(
        (params) => Object.keys(params ?? {}),
      );
    });
  assert.ok(siteParams.includes('hugoMinVersion'), 'site params are read');
  assert.ok(siteParams.includes('description'), 'language params are read');
  // Hugo matches param names case-insensitively.
  const lowered = new Set(siteParams.map((key) => key.toLowerCase()));
  for (const param of Object.keys(liveVersions)) {
    assert.match(param, /Vers$/, `${param} carries the page-only suffix`);
    assert.ok(!lowered.has(param.toLowerCase()), `${param} is page-only`);
  }
  for (const key of siteParams) {
    assert.doesNotMatch(
      key,
      /Vers$/,
      `site param ${key} leaves *Vers to pages`,
    );
  }
});

test('blog posts render no live version', () => {
  const posts = blogPosts();
  assert.ok(posts.length > 0, 'blog posts are found');
  for (const post of posts) {
    const text = fs.readFileSync(path.join(blogDir, post), 'utf8');
    assert.doesNotMatch(
      text,
      /\{\{[%<]\s*(?:(?:hugo|sass-embedded|dev)-version\b|_?param\s+"?(?:hugoMinVersion|tdVersion|version|katex\.version|redoc\.version|docsy\.plugins\.\w+\.version)\b)/i,
      `${post} renders no live version`,
    );
  }
});

const stampedVersion = () => readJSON('theme/package.json').version;

// A patch section for an earlier release is history: its rows read a `vX_Y_Z`
// block, never a top-level param, which the next patch moves.
function assertOlderPatchSectionsFrozen(post, text) {
  const liveParam = new RegExp(
    String.raw`\{\{[%<]\s*_?param\s+"?(?:${Object.keys(liveVersions).join('|')})\b`,
  );
  const sections = text.matchAll(
    /^## v(\d+\.\d+\.\d+)\b.*\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm,
  );
  for (const [, version, body] of sections) {
    if (version === stampedVersion()) continue;
    assert.doesNotMatch(
      body,
      liveParam,
      `${post}'s v${version} section reads frozen values only`,
    );
  }
}

// Until published, and again while its release is being stamped, a post's
// frozen values must track the live declarations (published values age by
// design). Also keeps companion posts in agreement.
test('draft and stamped-release posts freeze the declared versions', () => {
  const stamped = stampedVersion();
  const isRelease = STABLE_SEMVER.test(stamped);
  const stampedLine = stamped.split('.').slice(0, 2).join('.') + '.';
  let draftCompared = 0;
  let stampedCompared = 0;
  // The release post is named for the stamp (a patch renames the line's post).
  const isReleasePost = (post) => path.basename(post) === `${stamped}.md`;
  if (isRelease) {
    assert.ok(
      blogPosts().some(isReleasePost),
      `${stamped}.md is the release post`,
    );
  }
  for (const post of blogPosts()) {
    const text = fs.readFileSync(path.join(blogDir, post), 'utf8');
    const frontMatter = frontMatterOf(text);
    const isDraft = /^draft: true$/m.test(frontMatter);
    const releaseVers = pageParamOf(frontMatter, 'docsyReleaseVers');
    if (
      isRelease &&
      (isReleasePost(post) || releaseVers?.startsWith(stampedLine))
    ) {
      assert.equal(releaseVers, stamped, `${post} is on the stamped release`);
    }
    if (isRelease && isDraft) {
      const prev = pageParamOf(frontMatter, 'docsyPrevRelVers');
      if (prev !== undefined) {
        assert.equal(prev, stamped, `${post} follows the stamped release`);
      }
    }
    const isStamped = releaseVers === stamped;
    if (isStamped) assertOlderPatchSectionsFrozen(post, text);
    if (!isDraft && !isStamped) continue;
    for (const [param, live] of Object.entries(liveVersions)) {
      const frozen = pageParamOf(frontMatter, param);
      if (frozen === undefined) continue;
      assert.equal(frozen, live(), `${post} freezes the current ${param}`);
      if (isDraft) draftCompared++;
      else stampedCompared++;
    }
  }
  assert.ok(draftCompared > 0, 'a draft post freezes a declared version');
  if (isRelease) {
    assert.ok(stampedCompared > 0, 'a stamped post freezes a declared version');
  }
});

// A draft guide whose title advertises an upper version bound (`0.166.x`, or
// an exact `0.166.0`) must keep it on the frozen target: advancing the
// supported Hugo version then forces a review of the guide's title and
// coverage.
test('draft post titles cover the frozen supported Hugo version', () => {
  for (const post of blogPosts()) {
    const frontMatter = frontMatterOf(
      fs.readFileSync(path.join(blogDir, post), 'utf8'),
    );
    if (!/^draft: true$/m.test(frontMatter)) continue;
    const title = frontMatter.match(/^title:(.*)$/m)?.[1] ?? '';
    // The last version in a Hugo guide's title is its upper bound.
    const bound = title.match(
      /^\s*Hugo\b.*\b(\d+\.\d+\.(?:x|\d+))\b(?!.*\b\d+\.\d+\.(?:x|\d+)\b)/,
    )?.[1];
    if (!bound) continue;
    const target = pageParamOf(frontMatter, 'hugoSupportedVers');
    const covers = bound.endsWith('.x')
      ? target?.startsWith(bound.slice(0, -1))
      : target === bound;
    assert.ok(
      covers,
      `${post} title bound ${bound} covers the supported Hugo version ${target}`,
    );
  }
});
