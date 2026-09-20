// Pins Mermaid's registry conversion offline: the companion (a
// resources.GetRemote existence check plus the config block) is stubbed with a
// marker wherever a build would reach the fetch; the real companion, its
// config transport, and the runtime are pinned in the visual suite
// (mermaid-runtime.test.mjs, js-runtime.test.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const fence = '```mermaid\ngraph LR;\n  A-->B;\n```\n';
const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\n\n' + fence,
};
const stubbed = {
  ...files,
  'layouts/_partials/scripts/plugins/mermaid.html':
    '<script data-companion="mermaid" data-version="{{ .Plugin.version }}"></script>\n',
};
const companionTrap = {
  ...files,
  'layouts/_partials/scripts/plugins/mermaid.html':
    '{{ errorf "mermaid-companion-entered" }}',
};
const diagramFree = {
  ...companionTrap,
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
};

const pluginTag = (html) =>
  html.match(/<script[^>]*src="\/(js\/plugins\/mermaid[^"]*\.js)"[^>]*>/);
const mermaidScripts = /data-companion="mermaid"|js\/plugins\/mermaid/;

test('a fenced page gets the markup, the companion, then the deferred plugin; a diagram-free page gets neither', () => {
  const r = buildSite('mermaid-default', { files: stubbed });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /deprecated|floating-version/,
    'theme defaults build quietly',
  );
  const html = r.publicFile('docs/index.html');
  assert.match(
    html,
    /<pre class="mermaid">\s*graph LR;/,
    'render hook emits the library-shaped markup',
  );
  assert.match(
    html,
    /data-companion="mermaid" data-version="\d+\.\d+\.\d+"/,
    "companion receives the theme's pin",
  );
  const tag = pluginTag(html);
  assert.ok(tag, 'mermaid plugin script tag is emitted');
  assert.match(tag[0], /\bdefer\b/, 'shim pins deferred loading');
  assert.ok(
    html.indexOf('data-companion="mermaid"') < html.indexOf(tag[0]),
    'companion precedes the entry',
  );
  assert.doesNotMatch(
    r.publicFile(tag[1]),
    /\d+\.\d+\.\d+|jsdelivr/,
    'bundle is free of the pin and the CDN URL: both ride the companion',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    mermaidScripts,
    'home page is free of mermaid scripts',
  );
});

test('a diagram-free site never reaches the companion (no build-time fetch)', () => {
  const r = buildSite('mermaid-absent', {
    files: diagramFree,
    extraConfig: 'params:\n  mermaid:\n    theme: forest\n',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /deprecated/,
    'params.mermaid settings build free of deprecation warnings',
  );
});

test('the shim pins deferred loading against a site entry', () => {
  const r = buildSite('mermaid-defer-pinned', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      mermaid: { _defer: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    pluginTag(r.publicFile('docs/index.html'))[0],
    /\bdefer\b/,
    'tag stays deferred',
  );
});

test('a registry entry turns Mermaid off, markup intact', () => {
  const r = buildSite('mermaid-disabled', {
    files: companionTrap,
    extraConfig: `params:
  docsy:
    plugins:
      mermaid: { enable: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('docs/index.html');
  assert.match(html, /<pre class="mermaid">/, 'render hook still runs');
  assert.doesNotMatch(html, mermaidScripts, 'page is free of mermaid scripts');
});

test('the legacy params.mermaid.version fails the build, naming the entry field', () => {
  const r = buildSite('mermaid-legacy-version', {
    files: stubbed,
    extraConfig: `params:
  mermaid:
    version: 11.4.0
    theme: forest
  docsy:
    plugins:
      mermaid: { version: 11.17.1 }
`,
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /params\.mermaid\.version was removed[\s\S]*params\.docsy\.plugins/,
    'error names the removed param and the entry to set instead',
  );
});

test('a stale legacy pin fails a diagram-free site too', () => {
  const r = buildSite('mermaid-legacy-version-unused', {
    files: diagramFree,
    extraConfig: "params:\n  mermaid:\n    version: ''\n",
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /params\.mermaid\.version was removed/,
    'dead config fails on any page, not only where a diagram would read it',
  );
});

test('an exact version on the registry entry reaches the companion quietly', () => {
  const r = buildSite('mermaid-registry-version', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      mermaid: { version: 11.17.1 }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /deprecated|floating-version/,
    'exact entry pin builds quietly',
  );
  assert.match(
    r.publicFile('docs/index.html'),
    /data-version="11.17.1"/,
    'entry version reaches the companion unchanged',
  );
});

test('a floating registry version warns under the documented id', () => {
  const r = buildSite('mermaid-registry-floating', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      mermaid: { version: latest }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.mermaid\.version is not an exact X\.Y\.Z version[\s\S]*mermaid-floating-version/,
    'warning names the entry field and the suppression id 0.17 users know',
  );
});

test('a section print page carries child-page markup but not the plugin (pre-0.18 gap, kept)', () => {
  const r = buildSite('mermaid-print', {
    files: {
      ...stubbed,
      'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
      'content/docs/diagram.md': '---\ntitle: Diagram\n---\n\n' + fence,
    },
    extraConfig: 'outputs:\n  section: [HTML, print]\n',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('_print/docs/index.html');
  assert.match(html, /<pre class="mermaid">/, 'print output has the markup');
  assert.doesNotMatch(
    html,
    mermaidScripts,
    'print output is plugin-free: the flag is set on the child page',
  );
});

test('a pre-0.18 scripts.html override fails naming the removed partial', () => {
  const r = buildSite('mermaid-dispatcher-override', {
    files: {
      ...stubbed,
      'layouts/_partials/scripts.html':
        '{{ if .Page.Store.Get "hasmermaid" }}{{ partial "scripts/mermaid.html" . }}{{ end }}\n' +
        '{{ partial "scripts/main-bundle.html" . }}\n{{ partial "scripts/plugins.html" . }}\n',
    },
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /scripts\/mermaid\.html/,
    'failure names the partial the override still calls',
  );
});
