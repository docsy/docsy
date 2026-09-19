// Mermaid plugin runtime net (network tier: real companion, real CDN
// import). Pins the companion's config transport per language, the
// deferred entry's explicit start (no earlier than `load`, hook-emitted
// markup included), the theme-change reload during a pending render, and
// the logged failure of a bad diagram. The offline registry cases are in
// fixture-site/mermaid-plugin.test.mjs.
// https://www.docsy.dev/project/quality/script-loading/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from '../fixture-site/lib/build-site.mjs';
import { launchBrowser, serveDir } from './lib/harness.mjs';

const fence = '```mermaid\ngraph LR;\n  A[Alpha]-->B[Beta];\n```\n';
const page = (title, body) => `---\ntitle: ${title}\n---\n\n${body}`;
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
      'content/docs/_index.en.md': page('Docs', fence),
      'content/docs/_index.fr.md': page('Docs', fence),
      'content/docs/broken.en.md': page(
        'Broken',
        '```mermaid\ngraph LR;\n  A-->;\n  ((( not a diagram\n```\n',
      ),
      // A fence the render hook never sees, emitted after the plugin's
      // script tag: renders only if the entry runs after parsing.
      'layouts/_partials/hooks/body-end.html':
        '<pre class="mermaid">graph TD;\n  X-->Y;</pre>\n<img src="/hold.png" alt="">\n',
      'static/hold.png': holdPng,
    },
    extraConfig: `defaultContentLanguage: en
defaultContentLanguageInSubdir: true
languages:
  en:
    params:
      mermaid: { flowchart: { diagramPadding: 6 } }
  fr:
    params:
      mermaid: { flowchart: { diagramPadding: 40 } }
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
    /<script type="application\/json" id="docsy-mermaid">(.*?)<\/script>/s,
  );
  assert.ok(m, 'the companion emits the config block');
  return JSON.parse(m[1]);
};

test('the companion carries the pinned CDN URL and each language its params', () => {
  const en = configBlock(build.publicFile('en/docs/index.html'));
  const fr = configBlock(build.publicFile('fr/docs/index.html'));
  assert.match(
    en.url,
    /^https:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@\d+\.\d+\.\d+\/dist\/mermaid\.esm\.min\.mjs$/,
    'the URL is the pinned ESM build, the one the check validated',
  );
  assert.equal(en.params.flowchart.diagrampadding, 6, 'en params ride along');
  assert.equal(fr.params.flowchart.diagrampadding, 40, 'fr params ride along');
  const html = build.publicFile('en/docs/index.html');
  assert.doesNotMatch(
    html,
    /<script type="module"|<script[^>]*src="https?:/,
    'the page is free of inline module scripts and cross-origin script tags',
  );
  const tag = html.match(/<script defer src="\/js\/plugins\/mermaid[^>]*>/);
  assert.ok(tag, 'the entry is a deferred same-origin script');
  assert.match(tag[0], /integrity="sha256-/, 'the entry carries SRI');
});

async function newProbePage() {
  const p = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  p.on('pageerror', (err) => pageErrors.push(err.message));
  p.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { page: p, pageErrors, consoleErrors };
}

const svgCount = (p) => p.$$eval('.mermaid svg', (els) => els.length);
const viewBox = (p) =>
  p.$eval('.mermaid svg', (svg) => svg.getAttribute('viewBox'));

test('content and hook fences render; per-language settings reach Mermaid with their casing', async () => {
  const boxes = {};
  for (const lang of ['en', 'fr']) {
    const { page: p, pageErrors } = await newProbePage();
    try {
      await p.goto(`${server.origin}/${lang}/docs/`, {
        waitUntil: 'networkidle0',
      });
      await p.waitForFunction(
        () => document.querySelectorAll('.mermaid svg').length === 2,
        { timeout: 15000 },
      );
      assert.equal(await svgCount(p), 2, `${lang}: both fences rendered`);
      boxes[lang] = await viewBox(p);
      assert.deepEqual(
        pageErrors,
        [],
        `${lang}: probe ran without page errors`,
      );
    } finally {
      await p.close();
    }
  }
  assert.notEqual(
    boxes.en,
    boxes.fr,
    'diagramPadding differs per language: params transported and re-cased',
  );
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

// The import settled: its module was fetched. A response is the strongest
// external signal; evaluation follows within the same task queue.
const importSettled = (p) =>
  p.waitForFunction(
    () =>
      performance
        .getEntriesByType('resource')
        .some((e) => /mermaid\.esm\.min\.mjs/.test(e.name) && e.responseEnd),
    { timeout: 20000 },
  );

test('rendering waits for load even when the import settles first', async () => {
  const { page: p, pageErrors } = await newProbePage();
  try {
    const release = await holdLoad(p);
    await p.goto(`${server.origin}/en/docs/`, {
      waitUntil: 'domcontentloaded',
    });
    await importSettled(p);
    await new Promise((r) => setTimeout(r, 1500));
    assert.notEqual(
      await p.evaluate(() => document.readyState),
      'complete',
      'load is still pending',
    );
    assert.equal(await svgCount(p), 0, 'nothing rendered before load');
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

test('a theme change during a pending render reloads the page', async () => {
  const { page: p, pageErrors } = await newProbePage();
  try {
    const release = await holdLoad(p);
    await p.goto(`${server.origin}/en/docs/`, {
      waitUntil: 'domcontentloaded',
    });
    await importSettled(p);
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
      waitUntil: 'networkidle0',
    });
    await p.waitForFunction(
      () => document.querySelectorAll('.mermaid[data-processed]').length === 2,
      { timeout: 15000 },
    );
    assert.ok(
      consoleErrors.some((e) => /Mermaid failed to render/.test(e)),
      'the entry logs the render failure',
    );
    assert.deepEqual(pageErrors, [], 'no uncaught exception or rejection');
    assert.equal(
      await svgCount(p),
      2,
      'the hook fence and the error bomb are SVGs',
    );
  } finally {
    await p.close();
  }
});
