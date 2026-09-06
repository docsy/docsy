// Pins click-to-copy's registry conversion and its legacy opt-outs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\n\n```sh\necho hi\n```\n',
};

test('click-to-copy ships as a deferred plugin by default', () => {
  const r = buildSite('c2c-default', {
    files,
    title: 'Docsy copy-button fixture',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  const m = html.match(
    /<script[^>]*\bdefer\b[^>]*src="\/(js\/plugins\/click-to-copy[^"]*\.js)"/,
  );
  assert.ok(m, 'plugin script tag is emitted, deferred');
  assert.match(
    r.publicFile(m[1]),
    /td-click-to-copy/,
    'plugin carries the copy-button code',
  );
  assert.doesNotMatch(
    html,
    /src="\/js\/click-to-copy/,
    'page is free of the pre-plugin script path',
  );
});

test('disable_click2copy_chroma ships zero copy-button bytes', () => {
  const r = buildSite('c2c-disabled', {
    files,
    title: 'Docsy copy-button absence fixture',
    extraConfig: 'params:\n  disable_click2copy_chroma: true\n',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /disable_click2copy_chroma is deprecated/,
    'legacy param draws a deprecation warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /click-to-copy[^"]*\.js/,
    'page is free of copy-button script tags',
  );
});

test('prism supersedes the copy-button plugin', () => {
  const r = buildSite('c2c-prism', {
    files,
    title: 'Docsy prism fixture',
    extraConfig: 'params:\n  prism_syntax_highlighting: true\n',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  assert.match(
    html,
    /src=['"]\/js\/prism\.js['"]/,
    'prism script tag is emitted',
  );
  assert.doesNotMatch(
    html,
    /click-to-copy[^"]*\.js/,
    'page is free of copy-button script tags alongside prism',
  );
});

test('legacy params read "false" from the environment as false', () => {
  // `x` delimiter: with `HUGO_`, the underscores in the key names split.
  const r = buildSite('c2c-legacy-env-false', {
    files,
    title: 'Docsy legacy env fixture',
    env: {
      HUGOxPARAMSxPRISM_SYNTAX_HIGHLIGHTING: 'false',
      HUGOxPARAMSxDISABLE_CLICK2COPY_CHROMA: 'false',
    },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  assert.doesNotMatch(html, /js\/prism\.js/, 'page is free of prism');
  assert.match(html, /js\/plugins\/click-to-copy/, 'copy button loads');
});

test('enable false turns the theme plugin off', () => {
  const r = buildSite('c2c-registry-off', {
    files,
    title: 'Docsy copy-button registry-off fixture',
    extraConfig: `params:
  docsy:
    plugins:
      click-to-copy: { enable: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /click-to-copy[^"]*\.js/,
    'page is free of copy-button script tags',
  );
});
