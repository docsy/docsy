// Fixture content and output probes shared across suites. One home for the
// doc-rooted recipe as tested (user guide: Adding content § Doc-rooted project),
// so the llms, root-page and chrome fixtures exercise the same site shape.

export const frontMatter = (fields) =>
  `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\n`;

const linkOnlyHome = (fields) =>
  frontMatter({ ...fields, build: '{ render: link }' });

// The doc-rooted recipe: the docs section published at each language root,
// link-only homes, two languages. Consumers append their outputs and cascades.
export const docRootedConfig = `permalinks:
  page:
    docs: /:sections[1:]/:slug/
  section:
    docs: /:sections[1:]
languages:
  en: { weight: 1, label: English }
  fr: { weight: 2, label: Français }
`;
export const docRootedHomes = (en = {}, fr = {}) => ({
  'content/_index.md': linkOnlyHome({ title: 'Home', ...en }),
  'content/_index.fr.md': linkOnlyHome({ title: 'Accueil', ...fr }),
});

// The user guide's llms.txt outputs (Agent support § llms.txt › Enable),
// without print.
export const llmsOutputs = `outputs:
  home: [HTML, markdown, LLMS]
  page: [HTML, markdown]
  section: [HTML, RSS, markdown]
`;

export const describedbyLinks = (html) =>
  html.split('</head>')[0].match(/<link rel="describedby" [^>]*>/g) ?? [];

export const chrome = {
  navbar: (h) => /class="td-navbar[\s"]/.test(h),
  footer: (h) => /class="td-footer[\s"]/.test(h),
  placeholder: (h, region, donor) =>
    h.includes(
      `class="td-chrome-placeholder" data-chrome-donor="${donor}" data-chrome-region="${region}"`,
    ),
};
