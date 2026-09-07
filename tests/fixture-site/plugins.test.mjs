// Loop-contract tests for params.docsy.plugins. Configuration reference:
// https://www.docsy.dev/docs/content/plugins/#configuration-reference; shim
// contract: https://www.docsy.dev/project/implementation/script-loading/
// Net inventory and rationale:
// https://www.docsy.dev/project/quality/script-loading/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { buildSite, repoRoot } from './lib/build-site.mjs';

const content = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
};

const helloJs = `import * as params from '@params';
console.log('hello-plugin', params.greeting);
`;

const quietJs = `console.log('quiet-plugin');
`;

// The gate half of the theme's markmap shim.
const gatingShim = (flag) =>
  '{{ $entry := .Plugin }}' +
  `{{ if not (.Page.Store.Get "${flag}") }}` +
  '{{ $entry = merge $entry (dict "enable" false) }}{{ end }}' +
  '{{ return $entry }}';

const tabs =
  '{{< tabpane text=true >}}\n' +
  '{{< tab header="One" >}}one{{< /tab >}}\n{{< /tabpane >}}\n';

test('an enabled plugin is built and emitted, with options as @params', () => {
  const r = buildSite('plugins-loop', {
    files: {
      ...content,
      'assets/js/plugins/hello.js': helloJs,
      'assets/js/plugins/quiet.js': quietJs,
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello:
        enable: true
        options:
          greeting: bonjour
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  const m = html.match(/<script[^>]*src="\/(js\/plugins\/hello[^"]*\.js)"/);
  assert.ok(m, 'hello plugin script tag is emitted');
  const js = r.publicFile(m[1]);
  assert.match(js, /bonjour/, 'plugin options reach the module via @params');

  assert.doesNotMatch(html, /quiet/, 'the page is free of the unlisted plugin');
  // Published output is fingerprinted, so a fixed-path read proves nothing.
  const published = readdirSync(path.join(r.site, 'public', 'js', 'plugins'));
  assert.ok(
    published.every((f) => !f.startsWith('quiet')),
    'published plugin output is free of the unlisted plugin',
  );
});

test('an entry without its required enable field warns and is skipped', () => {
  const r = buildSite('plugins-missing-required', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: {}
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.hello: missing required field\(s\) enable, skipped/,
    'the missing field is called out in a build warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'page is free of the invalid entry',
  );
});

test('a disabled plugin ships zero bytes', () => {
  const r = buildSite('plugins-disabled', {
    files: { ...content, 'assets/js/plugins/hello.js': helloJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello:
        enable: false
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    "the page is free of the disabled plugin's script tag",
  );
  // Theme plugins (click-to-copy) still publish; only the disabled one must be
  // absent.
  const published = readdirSync(path.join(r.site, 'public', 'js', 'plugins'));
  assert.ok(
    published.every((f) => !f.startsWith('hello')),
    'public tree is free of the disabled plugin',
  );
});

test('a scalar false warns and is skipped', () => {
  const r = buildSite('plugins-scalar-false', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: false
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.hello: false is not a plugin entry/,
    'the scalar is called out in a build warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'page is free of the invalid entry',
  );
});

test('a scalar true warns and is skipped', () => {
  const r = buildSite('plugins-scalar-true', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: true
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.hello: true is not a plugin entry/,
    'the scalar is called out in a build warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'page is free of the invalid entry',
  );
});

test('env overrides reach registry entries and read as booleans', () => {
  // `x` delimiter, used uniformly; only underscored key names need it. Why
  // values are strings: Configuration § Environment variables.
  const r = buildSite('plugins-env-override', {
    files: {
      ...content,
      'content/docs/code.md': '---\ntitle: Code\n---\n\n```sh\necho hi\n```\n',
    },
    env: {
      'HUGOxPARAMSxDOCSYxPLUGINSxCLICK-TO-COPYxENABLE': 'false',
      'HUGOxPARAMSxDOCSYxPLUGINSxTABPANE-PERSISTxDEFER': 'true',
    },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('docs/code/index.html');
  assert.doesNotMatch(
    html,
    /js\/plugins\/click-to-copy/,
    'env-disabled plugin is off',
  );
  assert.match(
    html,
    /<script[^>]*\bdefer\b[^>]*js\/plugins\/tabpane-persist/,
    'env-deferred plugin is deferred',
  );
});

test('a quoted "False" is not a false spelling: the plugin loads', () => {
  const r = buildSite('plugins-quoted-false', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: 'False' }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    "a quoted 'False' reads as true",
  );
});

test('defer is honored on the emitted script tag', () => {
  const r = buildSite('plugins-defer', {
    files: { ...content, 'assets/js/plugins/hello.js': helloJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello:
        enable: true
        defer: true
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('index.html'),
    /<script[^>]*\bdefer\b[^>]*src="\/js\/plugins\/hello/,
    'plugin script tag carries defer',
  );
});

test('weights order emission around the normal group without fixing tie order', () => {
  const r = buildSite('plugins-order', {
    files: {
      ...content,
      'assets/js/plugins/alpha.js': quietJs,
      'assets/js/plugins/beta.js': quietJs,
      'assets/js/plugins/gamma.js': quietJs,
      'assets/js/plugins/delta.js': quietJs,
      'assets/js/plugins/epsilon.js': quietJs,
      'assets/js/plugins/zeta.js': quietJs,
    },
    extraConfig: `params:
  docsy:
    plugins:
      alpha: { enable: true, weight: 10 }
      beta: { enable: true, weight: -10 }
      gamma: { enable: true, weight: 0 }
      delta: { enable: true }
      epsilon: { enable: true, weight: -20 }
      zeta: { enable: true, weight: 20 }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  const order = [
    ...html.matchAll(/js\/plugins\/(alpha|beta|gamma|delta|epsilon|zeta)/g),
  ].map((m) => m[1]);
  assert.equal(order.length, 6, 'each fixture plugin is emitted once');
  assert.deepEqual(
    order.slice(0, 2),
    ['epsilon', 'beta'],
    'negative weights emit first in ascending order',
  );
  assert.deepEqual(
    new Set(order.slice(2, 4)),
    new Set(['gamma', 'delta']),
    'omitted and zero weights share the normal group',
  );
  assert.deepEqual(
    order.slice(4),
    ['alpha', 'zeta'],
    'positive weights emit last in ascending order',
  );
});

test('a shim gates its plugin on a page flag, so it ships only where set', () => {
  const r = buildSite('plugins-gate', {
    files: {
      ...content,
      'layouts/_shortcodes/set-hello-flag.html':
        '{{ .Page.Store.Set "hasHello" true }}',
      'content/docs/uses.md':
        '---\ntitle: Uses\n---\n{{< set-hello-flag >}}\nUses the feature\n',
      'assets/js/plugins/hello.js': helloJs,
      'layouts/_partials/scripts/plugins/hello_docsy-shim.html':
        gatingShim('hasHello'),
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('docs/uses/index.html'),
    /js\/plugins\/hello/,
    'gated plugin loads on the page that sets the flag',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'pages without the flag are free of the gated plugin',
  );
});

test("a site sets a gated plugin's flag from the head-end hook to load it anywhere", () => {
  const files = {
    ...content,
    'assets/js/plugins/hello.js': quietJs,
    'layouts/_partials/scripts/plugins/hello_docsy-shim.html':
      gatingShim('hasHello'),
  };
  const extraConfig = `params:
  docsy:
    plugins:
      hello: { enable: true }
`;
  const gated = buildSite('plugins-gate-unflagged', { files, extraConfig });
  assert.equal(gated.status, 0, `hugo build succeeds:\n${gated.stderr}`);
  assert.doesNotMatch(
    gated.publicFile('index.html'),
    /js\/plugins\/hello/,
    'without the hook, a page free of the flag is free of the plugin',
  );
  const widened = buildSite('plugins-gate-widened', {
    files: {
      ...files,
      'layouts/_partials/hooks/head-end.html':
        '{{ .Page.Store.Set "hasHello" true }}',
    },
    extraConfig,
  });
  assert.equal(widened.status, 0, `hugo build succeeds:\n${widened.stderr}`);
  assert.match(
    widened.publicFile('index.html'),
    /js\/plugins\/hello/,
    'the head-end flag loads the gated plugin on the same page',
  );
});

test('a companion partial scripts/plugins/NAME.html is emitted with the plugin', () => {
  const r = buildSite('plugins-companion-partial', {
    files: {
      ...content,
      'assets/js/plugins/hello.js': helloJs,
      'layouts/_partials/scripts/plugins/hello.html':
        '<div data-hello-companion="{{ .Page.Title }}"' +
        ' data-hello-greeting="{{ .Plugin.options.greeting }}"></div>\n',
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello:
        enable: true
        options:
          greeting: bonjour
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  assert.match(
    html,
    /data-hello-companion="Home"/,
    'the companion partial renders with the page context',
  );
  assert.match(
    html,
    /data-hello-greeting="bonjour"/,
    "the companion partial sees the plugin entry's options",
  );
  assert.ok(
    html.indexOf('data-hello-companion') < html.indexOf('js/plugins/hello'),
    'the companion partial precedes the plugin script tag',
  );
});

test('a shim partial scripts/plugins/NAME_docsy-shim.html decorates the entry', () => {
  const r = buildSite('plugins-shim', {
    files: {
      ...content,
      'assets/js/plugins/hello.js': helloJs,
      'layouts/_partials/scripts/plugins/hello_docsy-shim.html':
        '{{ $entry := .Plugin }}' +
        '{{ if in (slice true "true" 1) .Page.Site.Params.legacyHelloOff }}' +
        '{{ $entry = merge $entry (dict "enable" false) }}{{ end }}' +
        '{{ return $entry }}',
    },
    extraConfig: `params:
  legacyHelloOff: true
  docsy:
    plugins:
      hello: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'page is free of the shim-disabled plugin',
  );
});

test('companion styles scss/plugins/NAME.scss ship through the CSS pipeline', () => {
  const r = buildSite('plugins-companion-css', {
    files: {
      ...content,
      'assets/js/plugins/hello.js': helloJs,
      'assets/scss/plugins/hello.scss':
        '.td-hello { &-inner { color: red; } }\n',
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  const m = html.match(
    /<link[^>]*href="\/(scss\/plugins\/hello[^"]*\.css)"[^>]*>/,
  );
  assert.ok(m, 'the plugin stylesheet link is emitted');
  assert.match(m[0], /integrity="sha256-/, 'stylesheet link carries SRI');
  assert.ok(
    html.indexOf('scss/plugins/hello') < html.indexOf('js/plugins/hello'),
    'the stylesheet link precedes the plugin script tag',
  );
  const css = r.publicFile(m[1]);
  assert.match(
    css,
    /\.td-hello-inner/,
    'the SCSS is compiled (nesting resolved)',
  );
  assert.doesNotMatch(css, /\n.*\n.*\n/, 'the stylesheet is minified');
});

test('a plugin with no matching asset warns but does not fail the build', () => {
  const r = buildSite('plugins-missing', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
      no-such-plugin: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /no-such-plugin/,
    'the missing plugin is called out in a build warning',
  );
});

test('a shim-gated missing plugin warns only where its flag is set', () => {
  const files = {
    ...content,
    'layouts/_partials/scripts/plugins/ghost_docsy-shim.html':
      gatingShim('hasGhost'),
  };
  const extraConfig = `params:
  docsy:
    plugins:
      ghost: { enable: true }
`;
  const unflagged = buildSite('plugins-gated-missing-unflagged', {
    files,
    extraConfig,
  });
  assert.equal(
    unflagged.status,
    0,
    `hugo build succeeds:\n${unflagged.stderr}`,
  );
  assert.doesNotMatch(
    unflagged.stderr,
    /ghost/,
    'build log is free of the entry while no page carries its flag',
  );
  const flagged = buildSite('plugins-gated-missing', {
    files: {
      ...files,
      'layouts/_partials/hooks/head-end.html':
        '{{ .Page.Store.Set "hasGhost" true }}',
    },
    extraConfig,
  });
  assert.equal(flagged.status, 0, `hugo build succeeds:\n${flagged.stderr}`);
  assert.match(
    flagged.stderr,
    /ghost/,
    'the missing gated plugin is called out in a build warning',
  );
});

test('a disabled missing plugin is never looked up, so it is silent', () => {
  const r = buildSite('plugins-disabled-missing', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
      ghost: { enable: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(r.stderr, /ghost/, 'build log is free of the entry');
});

test('a scalar params.docsy builds, warns, and turns theme plugins off', () => {
  // A site's own pre-0.18 `docsy` param.
  const r = buildSite('plugins-docsy-scalar', {
    files: {
      ...content,
      'content/docs/tabs.md': '---\ntitle: Tabs\n---\n\n' + tabs,
    },
    title: 'Docsy scalar-docsy fixture',
    extraConfig: `params:
  docsy: legacy-value
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy is reserved for theme settings and must be a map/,
    'clobbered registry is called out as a reserved key',
  );
  assert.doesNotMatch(
    r.publicFile('docs/tabs/index.html'),
    /js\/plugins/,
    'page is free of plugin output',
  );
});

test('a null params.docsy.plugins builds and warns', () => {
  // The likeliest edit: the only entry commented out, leaving `plugins:`.
  const r = buildSite('plugins-null-registry', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins must be a map/,
    'clobbered registry is called out in a build warning',
  );
});

test('an empty-map params.docsy.plugins keeps the theme plugins', () => {
  // The empty map, the guide's remedy for a null registry.
  const r = buildSite('plugins-empty-registry', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins: {}
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /params\.docsy\.plugins must be a map/,
    'empty map draws no registry warning',
  );
  assert.match(
    r.publicFile('index.html'),
    /js\/plugins\/click-to-copy/,
    'a theme plugin is still emitted',
  );
});

test('an empty effective registry warns when theme inheritance is disabled', () => {
  const r = buildSite('plugins-empty-effective-registry', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
      _merge: none
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins must be nonempty after configuration merging/,
    'the empty registry draws a configuration warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\//,
    'the empty registry emits zero plugin scripts',
  );
});

test('a nonempty registry can disable every theme plugin', () => {
  const r = buildSite('plugins-all-disabled', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
      click-to-copy: { enable: false }
      tabpane-persist: { enable: false }
      markmap: { enable: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /params\.docsy\.plugins must be nonempty/,
    'disabled entries satisfy the registry shape',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\//,
    'disabled entries emit zero plugin scripts',
  );
});

test('a list-shaped params.docsy.plugins builds and warns', () => {
  const r = buildSite('plugins-list-registry', {
    files: { ...content, 'assets/js/plugins/hello.js': helloJs },
    extraConfig: `params:
  docsy:
    plugins: [hello]
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins must be a map/,
    'the config shape is called out in a build warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'list-registered plugin is ignored',
  );
});

test('a falsy scalar params.docsy.plugins also warns', () => {
  const r = buildSite('plugins-falsy-registry', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins: false
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins must be a map/,
    'the config shape is called out in a build warning',
  );
});

test('a numeric plugin name resolves its asset', () => {
  // Hugo stringifies map keys, so a `2048:` key must still resolve 2048.js.
  const r = buildSite('plugins-numeric-name', {
    files: { ...content, 'assets/js/plugins/2048.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      2048: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('index.html'),
    /js\/plugins\/2048/,
    'the numeric-named plugin is emitted',
  );
});

test('every shape warning the loop emits carries docsy-config', () => {
  // The fixture trips the field, option-shape, entry-value, and name guards.
  const r = buildSite('plugins-config-id', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enabled: true, options: 1 }
      bad.name: {}
      other: on
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const ids = [...r.stderr.matchAll(/ignoreLogs = \['([a-z-]+)'\]/g)].map(
    (m) => m[1],
  );
  assert.ok(ids.length >= 4, `each violation names its id:\n${r.stderr}`);
  assert.deepEqual(
    [...new Set(ids)],
    ['docsy-config'],
    "loop's shape warnings share the docsy-config id",
  );
});

test('the loop applies every declared schema default', () => {
  const schema = parseYaml(
    readFileSync(
      path.join(repoRoot, 'theme/data/docsy/schema/params/docsy.yaml'),
      'utf8',
    ),
  );
  const fields = Object.entries(schema.entries.plugins.value.entries);
  const defaultedFields = fields.filter(([, spec]) =>
    Object.hasOwn(spec, 'default'),
  );
  assert.ok(defaultedFields.length > 0, 'the test exercises schema defaults');
  const r = buildSite('plugins-schema-agreement', {
    files: {
      ...content,
      'assets/js/plugins/hello.js': quietJs,
      'layouts/_partials/scripts/plugins/hello.html':
        '<script type="application/json" id="entry">{{ jsonify .Plugin }}</script>\n',
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('index.html');
  // Hugo autoescapes jsonify in a script context to a JS string literal, so
  // parse twice when needed.
  let entry = JSON.parse(html.match(/id="entry">(.*?)<\/script>/s)[1]);
  if (typeof entry === 'string') entry = JSON.parse(entry);
  for (const [field, spec] of defaultedFields) {
    const key = field.toLowerCase();
    assert.ok(key in entry, `loop carries the schema field ${field}`);
    assert.deepEqual(
      entry[key],
      spec.default,
      `${field} defaults per the schema`,
    );
  }
  assert.equal('version' in entry, false, 'an omitted version remains absent');
});

test('a path-traversing plugin name is rejected with a warning', () => {
  const r = buildSite('plugins-name-traversal', {
    files: {
      ...content,
      'assets/js/search.js': "console.log('not-a-plugin');\n",
      'assets/js/plugins/hello.js': helloJs,
    },
    extraConfig: `params:
  docsy:
    plugins:
      ../search: {}
      hello: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /\.\.\/search/,
    'invalid name is called out in a build warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /not-a-plugin|js\/search/,
    'page is free of the traversal-addressed script',
  );
  assert.match(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'well-formed entries still emit',
  );
});

test('plugin output is fingerprinted with SRI in development too', () => {
  const r = buildSite('plugins-dev-sri', {
    files: { ...content, 'assets/js/plugins/hello.js': helloJs },
    args: ['--environment', 'development'],
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const tag = r
    .publicFile('index.html')
    .match(/<script[^>]*src="\/js\/plugins\/hello\.[0-9a-f]{64}\.js"[^>]*>/);
  assert.ok(tag, 'development build publishes a hashed path');
  assert.match(tag[0], /integrity="sha256-/, 'tag carries SRI');
});

test('a site entry for a theme plugin inherits the unset fields', () => {
  // The theme declares click-to-copy with `defer: true`.
  const r = buildSite('plugins-theme-inherit', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
      click-to-copy:
        options: { note: kept }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('index.html'),
    /<script[^>]*\bdefer\b[^>]*src="\/js\/plugins\/click-to-copy/,
    'inherited defer reaches the tag',
  );
});

test('an explicit field overrides the inherited theme default', () => {
  const r = buildSite('plugins-theme-override', {
    files: content,
    extraConfig: `params:
  docsy:
    plugins:
      click-to-copy:
        defer: false
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const tag = r
    .publicFile('index.html')
    .match(/<script[^>]*src="\/js\/plugins\/click-to-copy[^>]*>/);
  assert.ok(tag, 'plugin tag is emitted');
  assert.doesNotMatch(
    tag[0],
    /\bdefer\b/,
    'site value wins over the theme default',
  );
});

test('enable false turns a theme plugin off', () => {
  const r = buildSite('plugins-theme-off', {
    files: {
      ...content,
      'content/docs/tabs.md': '---\ntitle: Tabs\n---\n\n' + tabs,
    },
    title: 'Docsy theme-off fixture',
    extraConfig: `params:
  docsy:
    plugins:
      tabpane-persist: { enable: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.publicFile('docs/tabs/index.html'),
    /tabpane-persist/,
    'page is free of the theme plugin turned off by the site',
  );
});

test("an entry's name is its key; a name field is ignored", () => {
  const r = buildSite('plugins-name-field', {
    files: {
      ...content,
      'assets/js/plugins/hello.js': quietJs,
      'assets/js/plugins/other.js': "console.log('other');\n",
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true, name: other }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /unknown field "name"/,
    'name field is called out as unknown',
  );
  const html = r.publicFile('index.html');
  assert.match(html, /js\/plugins\/hello/, 'keyed plugin is emitted');
  assert.doesNotMatch(
    html,
    /js\/plugins\/other/,
    'page is free of the redirect target',
  );
});

test('an unknown entry field warns and the entry still applies', () => {
  // The likeliest misspelling: `enabled` for `enable`.
  const r = buildSite('plugins-unknown-field', {
    files: {
      ...content,
      'content/docs/code.md': '---\ntitle: Code\n---\n\n```sh\necho hi\n```\n',
    },
    extraConfig: `params:
  docsy:
    plugins:
      click-to-copy: { enabled: false }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.click-to-copy: unknown field "enabled"/,
    'unknown field is called out in a build warning',
  );
  assert.match(
    r.publicFile('docs/code/index.html'),
    /js\/plugins\/click-to-copy/,
    'plugin keeps its theme defaults',
  );
});

test('a name ending in _docsy-shim is refused as reserved', () => {
  const r = buildSite('plugins-reserved-suffix', {
    files: { ...content, 'assets/js/plugins/hello_docsy-shim.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello_docsy-shim: {}
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /name "hello_docsy-shim" ends in the reserved _docsy-shim/,
    'reserved suffix is called out in a build warning',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /js\/plugins\/hello_docsy-shim/,
    'page is free of the reserved-name plugin',
  );
});

test('non-map options warn and the module gets an empty map', () => {
  const shapes = { scalar: 'not-a-map', empty: "''", zero: '0', list: '[]' };
  for (const [label, value] of Object.entries(shapes)) {
    const r = buildSite(`plugins-options-${label}`, {
      files: { ...content, 'assets/js/plugins/hello.js': helloJs },
      extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true, options: ${value} }
`,
    });
    assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
    assert.match(
      r.stderr,
      /params\.docsy\.plugins\.hello\.options must be a map/,
      `options: ${value} is called out in a build warning`,
    );
    const html = r.publicFile('index.html');
    assert.match(
      html,
      /js\/plugins\/hello/,
      `options: ${value} keeps the plugin`,
    );
    const js = r.publicFile(
      html.match(/src="\/(js\/plugins\/hello[^"]*\.js)"/)[1],
    );
    assert.doesNotMatch(js, /not-a-map/, 'module is free of the scalar');
  }
});

test('null options mean none, without a warning', () => {
  const r = buildSite('plugins-options-null', {
    files: { ...content, 'assets/js/plugins/hello.js': helloJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello:
        enable: true
        options:
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /options must be a map/,
    'build is free of an options warning',
  );
  assert.match(
    r.publicFile('index.html'),
    /js\/plugins\/hello/,
    'plugin is emitted',
  );
});

test('a version is validated for any entry, with the id derived from its name', () => {
  const floating = buildSite('plugins-version-floating', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true, version: latest }
`,
  });
  assert.equal(floating.status, 0, `hugo build succeeds:\n${floating.stderr}`);
  assert.match(
    floating.stderr,
    /params\.docsy\.plugins\.hello\.version is not an exact X\.Y\.Z version[\s\S]*hello-floating-version/,
    'a floating version warns under the entry-named id',
  );
  assert.match(
    floating.publicFile('index.html'),
    /js\/plugins\/hello/,
    'the plugin still loads',
  );

  const bad = buildSite('plugins-version-bad', {
    files: { ...content, 'assets/js/plugins/hello.js': quietJs },
    extraConfig: `params:
  docsy:
    plugins:
      hello: { enable: true, version: 1.0.0/../evil }
`,
  });
  assert.notEqual(bad.status, 0, 'hugo build fails');
  assert.match(
    bad.stderr,
    /params\.docsy\.plugins\.hello\.version: string matching/,
    'the guard names the entry',
  );
});
