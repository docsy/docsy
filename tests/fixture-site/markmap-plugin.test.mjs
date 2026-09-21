// Pins MarkMap's registry conversion offline: the companion (a
// resources.GetRemote of the autoloader) is stubbed with a marker wherever a
// build would reach the fetch; the real vendoring is pinned in the visual
// suite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildSite } from './lib/build-site.mjs';

const files = {
  'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
  'content/docs/_index.md':
    '---\ntitle: Docs\n---\n\n```markmap\n# root\n## leaf\n```\n',
};
const stubbed = {
  ...files,
  'layouts/_partials/scripts/plugins/markmap.html':
    '<script data-vendor="markmap-autoloader" data-version="{{ .Plugin.version }}"></script>\n',
};

test('disabled markmap contributes zero bytes to shipped JS', () => {
  const r = buildSite('markmap-disabled', {
    files,
    title: 'Docsy mind-map absence fixture',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  for (const page of ['index.html', 'docs/index.html']) {
    assert.doesNotMatch(
      r.publicFile(page),
      /<script[^>]*markmap|markmap[^"]*\.js/i,
      `${page} is free of markmap scripts`,
    );
  }
  const bundle = r.publicFile(
    r.publicFile('index.html').match(/src="\/(js\/main[^"]*\.js)"/)[1],
  );
  assert.doesNotMatch(
    bundle,
    /markmap/i,
    'main bundle is free of markmap code, template-emptied stubs included',
  );
});

test('any params.markmap fails the build, naming the registry entry', () => {
  for (const [name, config] of [
    [
      'markmap-legacy-enable',
      { extraConfig: 'params:\n  markmap:\n    enable: true\n' },
    ],
    ['markmap-legacy-scalar', { extraConfig: 'params:\n  markmap: false\n' }],
    // A stale pin, markmap off: refusal precedes the gate.
    [
      'markmap-legacy-version-off',
      { extraConfig: "params:\n  markmap:\n    version: ''\n" },
    ],
    ['markmap-legacy-env', { env: { HUGO_PARAMS_MARKMAP_ENABLE: 'false' } }],
  ]) {
    const r = buildSite(name, { files, ...config });
    assert.notEqual(r.status, 0, `${name}: hugo build fails`);
    assert.match(
      r.stderr,
      /params\.markmap was removed[\s\S]*params\.docsy\.plugins/,
      `${name}: error names the removed namespace and the entry to set instead`,
    );
  }
});

test('a registry-declared markmap entry is page-gated', () => {
  const r = buildSite('markmap-registry', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      markmap:
        enable: true
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /deprecated/,
    'a registry-only setup builds free of deprecation warnings',
  );
  assert.doesNotMatch(
    r.publicFile('index.html'),
    /markmap[^"]*\.js|js\/vendor/,
    'registry entry is page-gated: no markmap scripts without markmap content',
  );
  const html = r.publicFile('docs/index.html');
  assert.match(
    html,
    /<script[^>]*src="\/js\/plugins\/markmap[^"]*\.js"/,
    'markmap plugin script tag is emitted',
  );
  assert.match(
    html,
    /data-vendor="markmap-autoloader" data-version="\d+\.\d+\.\d+"/,
    "companion rides the registry entry too, with the theme's pin",
  );
});

test('an exact version on the registry entry reaches the companion unchanged', () => {
  const r = buildSite('markmap-registry-version', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true, version: "0.18.13" }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.doesNotMatch(
    r.stderr,
    /floating-version/,
    'an exact pin builds quietly',
  );
  assert.match(
    r.publicFile('docs/index.html'),
    /data-version="0.18.13"/,
    'the entry version reaches the companion unchanged',
  );
  const plugin = r
    .publicFile('docs/index.html')
    .match(/<script[^>]*src="\/(js\/plugins\/markmap[^"]*\.js)"/);
  assert.doesNotMatch(
    r.publicFile(plugin[1]),
    /0\.18\.13/,
    'the bundle is free of the version: a pin is not an option',
  );
});

test('a floating version on the registry entry warns under the pin id', () => {
  const r = buildSite('markmap-registry-floating', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true, version: latest }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.markmap\.version is not an exact X\.Y\.Z version[\s\S]*markmap-floating-version/,
    'the warning names the entry field and the documented suppression id',
  );
  assert.match(
    r.publicFile('docs/index.html'),
    /data-version="latest"/,
    'the floating version is honored',
  );
});

test('a numeric version is coerced to string before validation', () => {
  const r = buildSite('markmap-registry-numeric-version', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true, version: 0 }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.stderr,
    /params\.docsy\.plugins\.markmap\.version is not an exact X\.Y\.Z version/,
    'the coerced numeric version draws a floating-version warning',
  );
  assert.match(
    r.publicFile('docs/index.html'),
    /data-version="0"/,
    'the companion receives the coerced string',
  );
});

test('a present invalid version is rejected even when the entry is disabled', () => {
  const r = buildSite('markmap-disabled-bad-version', {
    files,
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { version: 0.18.12/package.json }
`,
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /markmap\.version: string matching/,
    'the supplied version must satisfy its schema',
  );
});

test('invalid version syntax fails before the companion', () => {
  for (const [name, extraConfig] of [
    [
      'markmap-version-path-entry',
      'params:\n  docsy:\n    plugins:\n      markmap: { enable: true, version: 0.18.12/package.json }\n',
    ],
    [
      'markmap-version-whitespace-entry',
      'params:\n  docsy:\n    plugins:\n      markmap: { enable: true, version: " 0.18.12 " }\n',
    ],
  ]) {
    const r = buildSite(name, {
      files: {
        ...files,
        'layouts/_partials/scripts/plugins/markmap.html':
          '{{ errorf "markmap-companion-entered" }}',
      },
      extraConfig,
    });
    assert.notEqual(r.status, 0, `${name}: hugo build fails`);
    assert.match(
      r.stderr,
      /markmap\.version: string matching/,
      `${name}: the guard refuses the version`,
    );
    assert.doesNotMatch(
      r.stderr,
      /markmap-companion-entered/,
      `${name}: the guard stops execution before the companion`,
    );
  }
});

test('a map-valued version fails the guard, not the cast', () => {
  const r = buildSite('markmap-version-map-entry', {
    files,
    extraConfig:
      'params:\n  docsy:\n    plugins:\n      markmap: { enable: true, version: { nested: value } }\n',
  });
  assert.notEqual(r.status, 0, 'hugo build fails');
  assert.match(
    r.stderr,
    /markmap\.version: string matching/,
    'guard names the offending value',
  );
});

test('the entry version reads "0.18.13" from the environment', () => {
  const r = buildSite('markmap-entry-env-version', {
    files: stubbed,
    extraConfig:
      'params:\n  docsy:\n    plugins:\n      markmap: { enable: true }\n',
    env: { HUGO_PARAMS_DOCSY_PLUGINS_MARKMAP_VERSION: '0.18.13' },
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('docs/index.html'),
    /data-version="0.18.13"/,
    'the environment pin reaches the companion',
  );
});

test('a deferred markmap entry keeps the autoloader exports (plugin merges)', () => {
  const r = buildSite('markmap-defer', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true, _defer: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('docs/index.html');
  assert.match(
    html,
    /<script[^>]*\bdefer\b[^>]*src="\/js\/plugins\/markmap/,
    '_defer is honored on the plugin tag',
  );
  const js = r.publicFile(
    html.match(/src="\/(js\/plugins\/markmap[^"]*\.js)"/)[1],
  );
  assert.doesNotMatch(
    js,
    /window\.markmap\s*=\s*\{/,
    'plugin merges into window.markmap',
  );
});

test('a markmap fence renders as a default code block when markmap is off', () => {
  const r = buildSite('markmap-fence-default', {
    files,
    title: 'Docsy markmap fence fixture',
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('docs/index.html'),
    /<pre tabindex="0"><code class="language-markmap" data-lang="markmap">/,
    "fence carries Hugo's default code-block markup",
  );
});

test('the map style is one fixed rule', () => {
  const r = buildSite('markmap-style', {
    files: stubbed,
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  const html = r.publicFile('docs/index.html');
  const plugin = html.match(
    /<script[^>]*src="\/(js\/plugins\/markmap[^"]*\.js)"/,
  );
  assert.ok(plugin, 'markmap plugin script tag is emitted');
  const { window } = new JSDOM(html, { runScripts: 'outside-only' });
  window.eval(r.publicFile(plugin[1]));
  const sheet = window.document.head.lastElementChild.sheet;
  assert.equal(sheet.cssRules.length, 1, 'plugin adds one rule');
  const rule = sheet.cssRules[0];
  assert.equal(rule.selectorText, '.markmap > svg', 'one rule is the map');
  assert.equal(rule.style.height, '300px', 'map height is fixed');
});

test('the head-end flag the guide publishes loads markmap on a page without a fence', () => {
  // Pins the `hasMarkmap` literal the docs publish.
  const r = buildSite('markmap-head-end-flag', {
    files: {
      ...stubbed,
      'layouts/_partials/hooks/head-end.html':
        '{{ .Page.Store.Set "hasMarkmap" true }}',
    },
    extraConfig: `params:
  docsy:
    plugins:
      markmap: { enable: true }
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.match(
    r.publicFile('index.html'),
    /js\/plugins\/markmap/,
    'the published flag widens the theme gate to a fence-free page',
  );
});
