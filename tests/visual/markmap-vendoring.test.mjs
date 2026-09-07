// Pins correct version selection when a multilingual site vendors MarkMap.
// Real CDN fetches place this outside the offline fixtures.
// https://www.docsy.dev/project/quality/script-loading/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from '../fixture-site/lib/build-site.mjs';

test('markmap serves each language its configured autoloader bytes', () => {
  const page = '---\ntitle: Map\n---\n\n```markmap\n# Root\n```\n';
  const versions = { en: '0.18.11', fr: '0.18.12' };
  const assetContent = (build, output) => {
    assert.equal(build.status, 0, `hugo build succeeds:\n${build.stderr}`);
    const vendor = build
      .publicFile(output)
      .match(/<script[^>]*src="\/(js\/vendor\/markmap-autoloader[^"]*\.js)"/);
    assert.ok(vendor, `${output} links the vendored autoloader`);
    return build.publicFile(vendor[1]);
  };
  const controls = Object.fromEntries(
    Object.entries(versions).map(([lang, version]) => {
      const build = buildSite(`markmap-pin-control-${lang}`, {
        files: { 'content/_index.md': page },
        extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true, version: '${version}' }
`,
      });
      return [lang, assetContent(build, 'index.html')];
    }),
  );
  assert.notEqual(
    controls.en,
    controls.fr,
    'the control pins produce distinct asset bytes',
  );
  const bilingual = buildSite('markmap-language-pins', {
    files: {
      'content/_index.en.md': page,
      'content/_index.fr.md': page,
    },
    extraConfig: `defaultContentLanguage: en
defaultContentLanguageInSubdir: true
languages:
${Object.entries(versions)
  .map(
    ([lang, version]) => `  ${lang}:
    params:
      docsy:
        plugins:
          markmap: { enable: true, version: '${version}' }
`,
  )
  .join('')}`,
  });
  for (const lang of Object.keys(versions)) {
    assert.equal(
      assetContent(bilingual, `${lang}/index.html`),
      controls[lang],
      `${lang} receives the bytes from its configured version`,
    );
  }
});
