// Plugin runtime net: an emitted plugin must actually execute in a browser.
// Rationale and red-proof:
// https://www.docsy.dev/project/quality/script-loading/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildSite } from '../fixture-site/lib/build-site.mjs';
import { launchBrowser, serveDir } from './lib/harness.mjs';

let browser;
let server;

before(async () => {
  const build = buildSite('plugins-runtime', {
    files: {
      'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
      'assets/js/plugins/probe.js':
        "window.__docsyPluginProbe = 'runtime-net';\n" +
        "document.body.dataset.pluginProbe = 'ran';\n",
      'assets/js/plugins/broken.js': 'this_symbol_does_not_exist();\n',
    },
    extraConfig: `params:
  docsy:
    plugins:
      probe:
        enable: true
      broken:
        enable: true
        defer: true
`,
  });
  if (build.status !== 0) {
    throw new Error(`fixture hugo build failed:\n${build.stderr}`);
  }
  server = await serveDir(path.join(build.site, 'public'));
  browser = await launchBrowser();
});

after(async () => {
  await Promise.all([browser?.close(), server?.close()]);
});

async function loadHome() {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    // Failed resource loads are environment noise here: off-origin
    // requests abort by design (offline-safe runs).
    if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text()))
      errors.push(msg.text());
  });
  const origin = server.origin;
  await page.setRequestInterception(true);
  page.on('request', (req) =>
    req.url().startsWith(origin) ? req.continue() : req.abort(),
  );
  await page.goto(`${origin}/`, { waitUntil: 'networkidle0' });
  return { page, errors };
}

test('an emitted plugin executes: its effects land', async () => {
  const { page, errors } = await loadHome();
  const probe = await page.evaluate(() => ({
    token: window.__docsyPluginProbe,
    dataset: document.body.dataset.pluginProbe,
  }));
  assert.equal(probe.token, 'runtime-net', 'plugin ran in the page');
  assert.equal(probe.dataset, 'ran', 'the plugin mutated the DOM');
  await page.close();
  // Red-proof doubling as the assertion (rationale: quality page).
  assert.equal(errors.length, 1, 'error tally sees exactly the broken plugin');
  assert.match(
    errors[0],
    /this_symbol_does_not_exist/,
    'the collector catches a broken plugin (red-proof)',
  );
});
