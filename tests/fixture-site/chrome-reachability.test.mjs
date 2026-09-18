// Cases: CCR-02 (kept reference instances / donor reachability). See the CCR case registry in tests/fixture-site/README.md.
// No-JS link-checker reachability: a `shared` build must expose the same unique
// chrome links — internal and external — to a checker (which runs no JavaScript)
// as a full build does.
//
// `shared` mode drops the repeated navbar, footer, and left-nav from inner pages
// but keeps one donor instance of each per locale. This is the static-HTML
// counterpart to the jsdom restoration-parity tests (chrome-nav,
// chrome-equivalence): nothing runs the client here — we read the built HTML as
// Lychee would, and assert those donors leave no chrome link unreachable.
//
// The fixture configures all three link-bearing chrome regions — a navbar menu
// (internal + external items), footer link columns (`params.links` user +
// developer, internal + external), and the foldable left-nav (the Docsy default,
// so the donor carries the whole tree). External chrome links matter most here:
// deduping site-wide externals (e.g. footer social/developer links) is a headline
// link-checking win. The one documented exception — per-page navbar links under
// `version_menu_pagelinks`, which the single kept navbar surfaces only for the
// home page — is deliberately not configured, so the contract holds exactly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { buildSite } from './lib/build-site.mjs';

const ORIGIN = 'https://example.org';

// External chrome links the donors must keep reachable without JS.
const NAVBAR_EXTERNAL = 'https://www.docsy.dev/';
const FOOTER_EXTERNAL = 'https://github.com/docsy/docsy';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  // A navbar (main-menu) target outside the docs tree, so the navbar donor
  // carries a link the inner docs pages never would.
  'content/about.md': '---\ntitle: About\n---\nAbout\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs landing\n',
  'content/docs/guide/_index.md': '---\ntitle: Guide\n---\nGuide\n',
  'content/docs/guide/intro.md': '---\ntitle: Intro\n---\nIntro\n',
  'content/docs/guide/setup.md': '---\ntitle: Setup\n---\nSetup\n',
  'content/docs/other.md': '---\ntitle: Other\n---\nOther\n',
};

// Foldable left-nav (Docsy default); a navbar main menu with an internal and an
// external item; and footer link columns (user + developer) carrying an internal
// and an external link. So all three chrome regions bear links a no-JS checker
// must still reach in shared mode.
const extraConfig = `params:
  ui:
    sidebar_menu_foldable: true
  links:
    user:
      - name: About us
        url: /about
        icon: fas fa-info-circle
    developer:
      - name: GitHub
        url: ${FOOTER_EXTERNAL}
        icon: fab fa-github
menus:
  main:
    - name: Docs
      pageRef: /docs
      weight: 10
    - name: About
      pageRef: /about
      weight: 20
    - name: Docsy
      url: ${NAVBAR_EXTERNAL}
      weight: 30
`;

// Both builds share a title so they differ only by output dir and build mode.
const title = 'Docsy reachability fixture';
const full = buildSite('reach-full', { files, extraConfig, title });
const shared = buildSite('reach-shared', {
  files,
  extraConfig,
  title,
  env: { HUGO_PARAMS_TD_CHROME: 'shared' },
});

// Every built HTML file under a build's public/ dir.
function* walkHtml(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const child = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walkHtml(child);
    else if (ent.name.endsWith('.html')) yield child;
  }
}

// The set of unique link targets a no-JS checker reaches across a whole build:
// every `<a href>` on every page, normalized to `origin + path` (trailing slash
// dropped, query/hash ignored). Includes external targets, since chrome carries
// external links too. Pure-fragment and empty hrefs are skipped.
function reachableLinks(build) {
  const links = new Set();
  for (const file of walkHtml(path.join(build.site, 'public'))) {
    const { document } = new JSDOM(readFileSync(file, 'utf8')).window;
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) continue;
      let url;
      try {
        url = new URL(href, `${ORIGIN}/`);
      } catch {
        continue;
      }
      links.add(url.origin + (url.pathname.replace(/\/$/, '') || '/'));
    }
  }
  return links;
}

test('shared mode (no JS) leaves every chrome link reachable, internal and external, as in a full build', () => {
  assert.equal(full.status, 0, `full build succeeds:\n${full.stderr}`);
  assert.equal(shared.status, 0, `shared build succeeds:\n${shared.stderr}`);

  // Precondition: shared mode really dropped the navbar, footer, and left-nav
  // from an inner page, so reachability is carried by the donor rather than
  // holding trivially — the external footer/navbar links must not be on the
  // inner page itself.
  const inner = shared.publicFile('docs/guide/intro/index.html');
  assert.ok(
    !/id="td-section-nav"/.test(inner),
    'shared inner page drops the inline left-nav',
  );
  assert.ok(
    !inner.includes(FOOTER_EXTERNAL),
    'shared inner page drops the footer (external developer link absent)',
  );
  assert.ok(
    !inner.includes(NAVBAR_EXTERNAL),
    'shared inner page drops the navbar (external menu link absent)',
  );

  const fullLinks = reachableLinks(full);
  const sharedLinks = reachableLinks(shared);

  // Precondition: the full build exposes the chrome links most at risk when
  // chrome is dropped — the deep left-nav tree, the navbar's internal and
  // external items, and the footer's internal and external links.
  for (const target of [
    `${ORIGIN}/docs`,
    `${ORIGIN}/docs/guide/intro`,
    `${ORIGIN}/docs/guide/setup`,
    `${ORIGIN}/docs/other`,
    `${ORIGIN}/about`,
    NAVBAR_EXTERNAL,
    FOOTER_EXTERNAL,
  ]) {
    assert.ok(fullLinks.has(target), `full build reaches ${target}`);
  }

  const dropped = [...fullLinks].filter((t) => !sharedLinks.has(t)).sort();
  assert.deepEqual(
    dropped,
    [],
    'shared mode reaches every link the full build does, without JavaScript',
  );
});
