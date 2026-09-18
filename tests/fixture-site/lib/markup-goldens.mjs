// Shared spec for the chrome markup goldens: one fixture site, a list of
// golden-tracked regions, and the region extractor. Consumed by
// markup-golden.test.mjs (assert) and update-markup-goldens.mjs (refresh).
// Part of the semantic-classes migration (docsy#783).

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build-site.mjs';

export const goldenDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'goldens',
);

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md':
    '---\ntitle: Docs\nmenu: { main: { weight: 10 } }\n---\nDocs landing\n',
  'content/docs/getting-started/_index.md':
    '---\ntitle: Getting started\n---\nSection landing\n',
  'content/docs/getting-started/install.md':
    '---\ntitle: Install\ntags: [setup]\n---\nLeaf page\n',
  'content/docs/reference/_index.md':
    '---\ntitle: Reference\n---\nSecond section, for sidebar depth\n',
  'content/docs/reference/config.md':
    '---\ntitle: Configuration\n---\nReference leaf\n',
  'content/about/_index.md':
    '---\ntitle: About\nmenu: { main: { weight: 20 } }\n---\nAbout body\n',
  'content/blog/_index.md': '---\ntitle: Blog\n---\nBlog landing\n',
  'content/blog/first-post.md':
    '---\ntitle: First post\ndate: 2026-08-01\n---\nPost body\n',
};

// Representative chrome config, so golden-tracked shots exercise populated
// regions rather than a bare skeleton: main-menu entries (page + external),
// footer links (FA icons) and copyright, and the dark-mode toggler.
const extraConfig = `menus:
  main:
    - name: GitHub
      url: https://github.com/docsy/docsy
      weight: 30
params:
  copyright:
    authors: >-
      Fixture Authors |
      [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
    from_year: 2020
    # Pinned: the default (current year) would roll the rendered footer,
    # and with it every committed page shot, each January 1.
    to_year: 2026
  links:
    user:
      - name: Mailing list
        url: https://example.org/mail
        icon: fa fa-envelope
    developer:
      - name: GitHub
        url: https://github.com/docsy/docsy
        icon: fab fa-github
  ui:
    showLightDarkModeMenu: true
`;

// name → golden file goldens/NAME.html; page → public file holding the
// region; re overrides the default breadcrumb extractor. The term region
// pins term.html's post-processing of the breadcrumb partial (replaceRE
// strips aria attributes, and with aria-current the current-item styling
// hook), which silently no-ops if the partial's attribute emission changes
// without the caller following.
export const regions = [
  { name: 'breadcrumb-single', page: 'docs/index.html' },
  { name: 'breadcrumb-mid', page: 'docs/getting-started/index.html' },
  { name: 'breadcrumb-deep', page: 'docs/getting-started/install/index.html' },
  {
    name: 'breadcrumb-term',
    page: 'tags/setup/index.html',
    re: /<nav[^>]*class="td-breadcrumbs(?=[\s"])[\s\S]*?<\/nav>/,
  },
  // Blog baseof wraps the same partial in a different layout context.
  { name: 'breadcrumb-blog', page: 'blog/first-post/index.html' },
];

const breadcrumbRe = /<nav aria-label="breadcrumb"[\s\S]*?<\/nav>/;

export function buildFixture(name = 'markup-goldens', extraFiles = {}) {
  const r = buildSite(name, {
    files: { ...files, ...extraFiles },
    extraConfig,
  });
  if (r.status !== 0) {
    throw new Error(`fixture hugo build failed:\n${r.stdout}${r.stderr}`);
  }
  return r;
}

export function extractRegions(build) {
  return regions.map(({ name, page, re }) => {
    const m = build.publicFile(page).match(re ?? breadcrumbRe);
    if (!m) throw new Error(`no breadcrumb region in ${page}`);
    return { name, page, html: m[0] + '\n' };
  });
}
