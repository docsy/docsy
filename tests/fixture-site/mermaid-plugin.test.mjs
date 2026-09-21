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
    '<script type="application/json" data-companion="mermaid" data-version="{{ .Plugin.version }}">{{ with .Plugin.options }}{{ jsonify . | safeJS }}{{ end }}</script>\n',
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

test('a diagram-free site makes no build-time fetch: the real companion under a remote deny list', () => {
  const r = buildSite('mermaid-absent', {
    files: {
      ...files,
      'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
    },
    extraConfig: `security:
  http:
    urls: ['^https://nowhere\\.invalid$']
params:
  docsy:
    plugins:
      mermaid: { options: '{"theme": "forest"}' }
`,
    args: ['--ignoreCache'],
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
});

test('options reach the companion as an object, key casing intact', () => {
  const r = buildSite('mermaid-options', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      mermaid:
        options: |
          { "theme": "neutral", "flowchart": { "diagramPadding": 6, "htmlLabels": false }, "secure": ["secure"] }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const m = r
    .publicFile('docs/index.html')
    .match(/data-companion="mermaid"[^>]*>([^<]*)<\/script>/);
  assert.ok(m, 'companion receives options');
  assert.deepEqual(
    JSON.parse(m[1]),
    {
      theme: 'neutral',
      flowchart: { diagramPadding: 6, htmlLabels: false },
      secure: ['secure'],
    },
    'JSON string decoded, camelCase keys, arrays and booleans intact',
  );
});

test('an empty options string is no options', () => {
  const r = buildSite('mermaid-options-empty', {
    files: stubbed,
    extraConfig:
      "params:\n  docsy:\n    plugins:\n      mermaid: { options: '' }\n",
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('docs/index.html'),
    /data-companion="mermaid"[^>]*><\/script>/,
    'companion sees no options',
  );
});

test('options set from the environment arrive as a string and decode', () => {
  const r = buildSite('mermaid-options-env', {
    files: stubbed,
    env: {
      HUGO_PARAMS_DOCSY_PLUGINS_MERMAID_OPTIONS:
        '{"flowchart": {"diagramPadding": 9}}',
    },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const m = r
    .publicFile('docs/index.html')
    .match(/data-companion="mermaid"[^>]*>([^<]*)<\/script>/);
  assert.deepEqual(
    JSON.parse(m[1]),
    { flowchart: { diagramPadding: 9 } },
    'environment value decoded with its casing',
  );
});

test('options that are not a JSON object string fail the build, naming the field', () => {
  for (const [name, options, reason] of [
    [
      'mermaid-options-map',
      '{ theme: forest }',
      /decoding failed: type .* not supported/,
    ],
    [
      'mermaid-options-bad-json',
      "'{ theme: forest }'",
      /decoding failed: .*invalid character/,
    ],
    ['mermaid-options-array', "'[1, 2]'", /decoded value is not an object/],
    ['mermaid-options-bool', 'false', /decoded value is not an object/],
  ]) {
    const r = buildSite(name, {
      files: stubbed,
      extraConfig: `params:\n  docsy:\n    plugins:\n      mermaid: { options: ${options} }\n`,
    });
    assert.notEqual(r.status, 0, `${name}: hugo build fails`);
    assert.match(r.stderr, reason, `${name}: error names the problem`);
  }
});

test('with the real companion under a remote deny list, a bad or blank options string draws only the shim error', () => {
  for (const [name, options, shimError] of [
    ['mermaid-options-blank-real', "'   '", null],
    ['mermaid-options-bad-real', "'{ theme: forest }'", /decoding failed/],
  ]) {
    const r = buildSite(name, {
      files,
      extraConfig: `security:
  http:
    urls: ['^https://nowhere\\.invalid$']
params:
  docsy:
    plugins:
      mermaid: { options: ${options} }
`,
      args: ['--ignoreCache'],
    });
    assert.notEqual(
      r.status,
      0,
      `${name}: hugo build fails (the denied fetch)`,
    );
    assert.doesNotMatch(
      r.stderr,
      /reached the companion undecoded/,
      `${name}: companion sees no leftover string`,
    );
    if (shimError)
      assert.match(r.stderr, shimError, `${name}: shim reports the decode`);
    assert.match(
      r.stderr,
      /Could not retrieve mermaid script from CDN/,
      `${name}: the denied fetch is the companion's only error`,
    );
    assert.equal(
      (r.stderr.match(/^ERROR (?!error building site)/gm) ?? []).length,
      shimError ? 2 : 1,
      `${name}: exactly the shim's error and the denied fetch`,
    );
  }
});

test('a shim override that skips the decode fails at the companion, not silently', () => {
  const r = buildSite('mermaid-shim-no-decode', {
    files: {
      ...files,
      'layouts/_partials/scripts/plugins/mermaid_docsy-shim.html':
        '{{ return (merge .Plugin (dict "_defer" true)) }}\n',
    },
    // The real companion runs: deny its CDN check so the net stays offline.
    extraConfig: `security:
  http:
    urls: ['^https://nowhere\\.invalid$']
params:
  docsy:
    plugins:
      mermaid: { options: '{"theme": "forest"}' }
`,
    args: ['--ignoreCache'],
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /options reached the companion undecoded \(string\)/,
    'companion names the undecoded value and the shim contract',
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

test('params.mermaid fails the build, naming the new homes', () => {
  const r = buildSite('mermaid-legacy-namespace', {
    files: stubbed,
    extraConfig: `params:
  mermaid:
    theme: forest
`,
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /params\.mermaid was removed[\s\S]*options[\s\S]*version/,
    'error names the removed namespace, the options string and the version field',
  );
});

test('a stale params.mermaid fails a diagram-free site too', () => {
  const r = buildSite('mermaid-legacy-version-unused', {
    files: diagramFree,
    extraConfig: "params:\n  mermaid:\n    version: ''\n",
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /params\.mermaid was removed/,
    'dead config fails on any page, not only where a diagram would read it',
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
