// Mermaid plugin runtime net: real companion, real CDN import, browser
// assertions. Offline registry cases: fixture-site/mermaid-plugin.test.mjs.
// https://www.docsy.dev/project/quality/script-loading/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from '../fixture-site/lib/build-site.mjs';
import {
  darkFromStart,
  launchBrowser,
  mermaidSvgStyle,
  serveDir,
} from './lib/harness.mjs';

const fence = '```mermaid\ngraph LR;\n  A[Alpha]-->B[Beta];\n```\n';
const page = (title, body) => `---\ntitle: ${title}\n---\n\n${body}`;
const MERMAID_12 = '12.0.0';
// 1x1 transparent PNG: the held subresource that keeps `load` pending.
const holdPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

let browser, server, build;

before(async () => {
  build = buildSite('mermaid-runtime', {
    files: {
      'content/_index.en.md': page('Home', 'Home body\n'),
      'content/_index.fr.md': page('Accueil', 'Accueil\n'),
      'content/_index.de.md': page('Start', 'Start\n'),
      // A heading whose Goldmark id is the plugin's name.
      'content/docs/_index.en.md': page('Docs', '## Docsy Mermaid\n\n' + fence),
      'content/docs/_index.fr.md': page('Docs', fence),
      'content/docs/_index.de.md': page('Docs', fence),
      'content/docs/broken.en.md': page(
        'Broken',
        '```mermaid\ngraph LR;\n  A-->;\n  ((( not a diagram\n```\n',
      ),
      // A fence the render hook never sees, emitted after the plugin's
      // script tag: renders only if the entry runs after parsing.
      'layouts/_partials/hooks/body-end.html':
        '<pre class="mermaid">graph TD;\n  X[Hook]-->Y[Fence];</pre>\n<img src="/hold.png" alt="">\n',
      'static/hold.png': holdPng,
    },
    extraConfig: `defaultContentLanguage: en
defaultContentLanguageInSubdir: true
languages:
  en:
    params:
      docsy:
        plugins:
          mermaid:
            options: '{"flowchart": {"diagramPadding": 6}}'
  fr:
    params:
      docsy:
        plugins:
          mermaid:
            options: '{"flowchart": {"diagramPadding": 40}}'
  de:
    params:
      docsy:
        plugins:
          mermaid: { version: ${MERMAID_12} }
`,
  });
  if (build.status !== 0) {
    throw new Error(
      `fixture hugo build failed:\n${build.stdout}${build.stderr}`,
    );
  }
  server = await serveDir(`${build.site}/public`);
  browser = await launchBrowser();
});

after(async () => {
  await Promise.all([browser?.close(), server?.close()]);
});

const configBlock = (html) => {
  const m = html.match(
    /<script type="application\/json" data-docsy-plugin="mermaid">(.*?)<\/script>/s,
  );
  assert.ok(m, 'companion emits the config block');
  return JSON.parse(m[1]);
};

test('the companion carries the pinned CDN URL and each language its options', () => {
  const en = configBlock(build.publicFile('en/docs/index.html'));
  const fr = configBlock(build.publicFile('fr/docs/index.html'));
  assert.match(
    en.url,
    /^https:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@\d+\.\d+\.\d+\/dist\/mermaid\.esm\.min\.mjs$/,
    'URL is the pinned ESM build, the one the check validated',
  );
  assert.equal(en.options.flowchart.diagramPadding, 6, 'en options ride along');
  assert.equal(
    fr.options.flowchart.diagramPadding,
    40,
    'fr options ride along',
  );
  const html = build.publicFile('en/docs/index.html');
  assert.equal(
    (html.match(/id="docsy-mermaid"/g) ?? []).length,
    1,
    'the "Docsy Mermaid" heading owns its id alone: the config block carries none',
  );
  assert.doesNotMatch(
    html,
    /<script type="module"|<script[^>]*src="https?:/,
    'page is free of inline module scripts and cross-origin script tags',
  );
  const tag = html.match(/<script defer src="\/js\/plugins\/mermaid[^>]*>/);
  assert.ok(tag, 'entry is a deferred same-origin script');
  assert.match(tag[0], /integrity="sha256-/, 'entry carries SRI');
});

async function newProbePage() {
  const p = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  p.on('pageerror', (err) => pageErrors.push(err.message));
  // Resource 404s (the fixture's favicon) are js-runtime's concern.
  p.on('console', (msg) => {
    if (msg.type() !== 'error' || /Failed to load resource/.test(msg.text()))
      return;
    consoleErrors.push(msg.text());
  });
  return { page: p, pageErrors, consoleErrors };
}

// Mermaid renders a bad diagram as an SVG too: healthy pages must count
// diagrams, not SVGs.
const diagramCounts = (p) =>
  p.evaluate(() => ({
    svgs: document.querySelectorAll('.mermaid svg').length,
    errors: document.querySelectorAll(
      '.mermaid svg[aria-roledescription="error"]',
    ).length,
    labels: Array.from(
      document.querySelectorAll('.mermaid svg .nodeLabel'),
      (n) => n.textContent,
    ),
  }));
const viewBox = (p) =>
  p.$eval('.mermaid svg', (svg) => svg.getAttribute('viewBox'));

async function assertHealthy(p, lang, { pageErrors, consoleErrors }) {
  // Mermaid inserts an SVG before its labels land: wait for the asserted state.
  await p.waitForFunction(
    () => document.querySelectorAll('.mermaid svg .nodeLabel').length === 4,
    { timeout: 15000 },
  );
  const { errors, labels } = await diagramCounts(p);
  assert.equal(errors, 0, `${lang}: rendered SVGs are diagrams, not errors`);
  assert.deepEqual(
    labels.sort(),
    ['Alpha', 'Beta', 'Fence', 'Hook'],
    `${lang}: content and hook fences both rendered`,
  );
  assert.deepEqual(pageErrors, [], `${lang}: probe ran without page errors`);
  assert.deepEqual(consoleErrors, [], `${lang}: console is error-free`);
}

test('content and hook fences render; per-language options reach Mermaid', async () => {
  const boxes = {};
  for (const lang of ['en', 'fr']) {
    const probe = await newProbePage();
    try {
      await probe.page.goto(`${server.origin}/${lang}/docs/`, {
        waitUntil: 'domcontentloaded',
      });
      await assertHealthy(probe.page, lang, probe);
      boxes[lang] = await viewBox(probe.page);
    } finally {
      await probe.page.close();
    }
  }
  assert.notEqual(
    boxes.en,
    boxes.fr,
    'diagramPadding differs per language: options transported',
  );
});

test('experimental: a Mermaid 12 pin renders, light and dark', async () => {
  assert.match(
    configBlock(build.publicFile('de/docs/index.html')).url,
    new RegExp(`/mermaid@${MERMAID_12.replaceAll('.', '\\.')}/`),
    'de imports the 12.x pin',
  );
  const styles = {};
  for (const mode of ['light', 'dark']) {
    const probe = await newProbePage();
    try {
      if (mode === 'dark') await darkFromStart(probe.page);
      await probe.page.goto(`${server.origin}/de/docs/`, {
        waitUntil: 'domcontentloaded',
      });
      await assertHealthy(probe.page, `de ${mode}`, probe);
      styles[mode] = await mermaidSvgStyle(probe.page);
    } finally {
      await probe.page.close();
    }
  }
  assert.ok(styles.light, 'SVG carries its theme style');
  assert.notEqual(styles.dark, styles.light, 'dark rendering differs');
});

// Holds /hold.png so `load` stays pending while the CDN import settles.
async function holdLoad(p) {
  await p.setRequestInterception(true);
  let held;
  let released = false;
  p.on('request', (req) => {
    if (!released && new URL(req.url()).pathname === '/hold.png') {
      held = req;
      return;
    }
    req.continue();
  });
  return () => {
    released = true;
    held?.continue();
  };
}

// Every import the entry started has settled: the network is idle apart
// from the one held request. An entry that starts rendering before `load`
// fetches diagram chunks and produces SVGs before release.
const importsSettled = (p) =>
  p.waitForNetworkIdle({ idleTime: 1000, concurrency: 1, timeout: 30000 });

test('rendering waits for load even when the import settles first', async () => {
  const { page: p, pageErrors } = await newProbePage();
  try {
    const release = await holdLoad(p);
    await p.goto(`${server.origin}/fr/docs/`, {
      waitUntil: 'domcontentloaded',
    });
    await importsSettled(p);
    assert.notEqual(
      await p.evaluate(() => document.readyState),
      'complete',
      'load is pending while the import has settled',
    );
    assert.equal(
      (await diagramCounts(p)).svgs,
      0,
      'rendering starts no earlier than load',
    );
    release();
    await p.waitForFunction(
      () => document.querySelectorAll('.mermaid svg').length === 2,
      { timeout: 15000 },
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await p.close();
  }
});

test('a theme change while the render is pending reloads the page', async () => {
  const { page: p, pageErrors } = await newProbePage();
  try {
    const release = await holdLoad(p);
    await p.goto(`${server.origin}/fr/docs/`, {
      waitUntil: 'domcontentloaded',
    });
    await importsSettled(p);
    const reloaded = p.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await p.evaluate(() =>
      document.documentElement.setAttribute('data-bs-theme', 'dark'),
    );
    await reloaded;
    release();
    await p.waitForFunction(
      () => document.querySelectorAll('.mermaid svg').length === 2,
      { timeout: 15000 },
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await p.close();
  }
});

test('a bad diagram is logged, not thrown, and the rest still renders', async () => {
  const { page: p, pageErrors, consoleErrors } = await newProbePage();
  try {
    await p.goto(`${server.origin}/en/docs/broken/`, {
      waitUntil: 'domcontentloaded',
    });
    await p.waitForFunction(
      () =>
        document.querySelectorAll('.mermaid svg[aria-roledescription="error"]')
          .length === 1 &&
        document.querySelectorAll('.mermaid svg .nodeLabel').length === 2,
      { timeout: 15000 },
    );
    const { svgs, errors, labels } = await diagramCounts(p);
    assert.ok(
      consoleErrors.some((e) => /Mermaid failed to render/.test(e)),
      'entry logs the render failure',
    );
    assert.deepEqual(pageErrors, [], 'failure is caught, not thrown');
    assert.equal(errors, 1, 'bad diagram renders as one error SVG');
    assert.equal(svgs, 2, 'hook fence renders alongside the error');
    assert.deepEqual(
      labels.sort(),
      ['Fence', 'Hook'],
      'hook diagram is intact',
    );
  } finally {
    await p.close();
  }
});
