// Copy-button readiness net: under a site's conflicting `defer: false`, the
// plugin still runs against the parsed document and copies the text of
// blocks emitted before and after its tag. Rationale and red-proof:
// https://www.docsy.dev/project/quality/script-loading/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildSite } from '../fixture-site/lib/build-site.mjs';
import { launchBrowser, serveDir } from './lib/harness.mjs';

// Copied text equals the source: distinct sources, so a copy from the wrong
// block can't pass.
const block = {
  source: 'echo one\n  echo indented\n',
  copied: 'echo one\n  echo indented\n',
};
// Emitted by the fixture's body-end hook, after the plugin script tag.
const hookBlock = {
  source: 'echo from-body-end-hook',
  copied: 'echo from-body-end-hook\n',
};

let browser;
let server;
let build;

before(async () => {
  build = buildSite('click-to-copy-runtime', {
    files: {
      'content/_index.md': '---\ntitle: Home\n---\n',
      'content/docs/_index.md': '---\ntitle: Docs\n---\n',
      'content/docs/copy.md':
        `---\ntitle: Copy\nlaterBlock: ${hookBlock.source}\n---\n\n` +
        `\`\`\`sh\n${block.source}\`\`\`\n`,
      'layouts/_partials/hooks/body-end.html':
        '{{ with .Params.laterBlock }}{{ highlight . "sh" }}{{ end }}\n',
    },
    // `version: latest` draws a warning that proves the entry arrived.
    extraConfig: `params:
  docsy:
    plugins:
      click-to-copy: { defer: false, version: latest }
`,
  });
  if (build.status !== 0) {
    throw new Error(`fixture hugo build failed:\n${build.stderr}`);
  }
  assert.match(
    build.stderr,
    /click-to-copy-floating-version/,
    'site entry reaches the loop',
  );
  server = await serveDir(path.join(build.site, 'public'));
  browser = await launchBrowser();
});

after(async () => {
  await Promise.all([browser?.close(), server?.close()]);
});

// Own browser context per page: the clipboard permission grant stays scoped
// to it.
async function openPage(pagePath) {
  const context = await browser.createBrowserContext();
  await context.overridePermissions(server.origin, [
    'clipboard-read',
    'clipboard-write',
    // The scripted seed write below has no user gesture behind it.
    'clipboard-sanitized-write',
  ]);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  await page.setRequestInterception(true);
  page.on('request', (req) =>
    req.url().startsWith(server.origin) ? req.continue() : req.abort(),
  );
  await page.goto(`${server.origin}/${pagePath}`, {
    waitUntil: 'networkidle0',
  });
  // readText() requires document focus.
  await page.bringToFront();
  return { page, pageErrors, close: () => context.close() };
}

// Click the copy button of code block `index` and return the clipboard text
// it wrote.
async function copyFromBlock(page, index) {
  const seed = `unwritten seed ${index} ${Date.now()}`;
  const readBack = await page.evaluate(async (s) => {
    await navigator.clipboard.writeText(s);
    return navigator.clipboard.readText();
  }, seed);
  assert.equal(readBack, seed, 'clipboard seed reads back');
  const button = (await page.$$('.highlight .td-click-to-copy'))[index];
  assert.ok(button, `block ${index} has a copy button`);
  // Puppeteer skips its pre-click scroll when the button already intersects
  // the viewport, fixed navbar overlay or not; centering first lands the
  // click on the button. Instant: Bootstrap's reboot smooth-scrolls, and a
  // click landing mid-scroll slides the pointer off the button (mouseout
  // resets the tooltip).
  await button.evaluate((el) =>
    el.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await button.click();
  const copied = await page.waitForFunction(
    (s) => navigator.clipboard.readText().then((t) => t !== s && t),
    { timeout: 5000 },
    seed,
  );
  assert.equal(
    await button.evaluate((el) => el.getAttribute('data-bs-original-title')),
    'Copied!',
    'button tooltip reports the copy',
  );
  return copied.jsonValue();
}

test('a conflicting site defer leaves the tag deferred and the hook block after it', () => {
  const html = build.publicFile('docs/copy/index.html');
  const tag = html.match(/<script[^>]*src="\/js\/plugins\/click-to-copy[^>]*>/);
  assert.ok(tag, 'plugin tag is emitted');
  assert.match(tag[0], /\bdefer\b/, 'plugin tag defers');
  // Chroma splits the source into spans; its last token survives intact.
  const hookAt = html.indexOf('from-body-end-hook');
  assert.ok(hookAt > 0, 'hook block is emitted');
  assert.ok(
    hookAt > html.indexOf(tag[0]),
    'fixture emits the hook block after the plugin script tag',
  );
});

test('copy: blocks before and after the plugin tag copy their text', async () => {
  const { page, pageErrors, close } = await openPage('docs/copy/');
  try {
    assert.equal(
      await page.$$eval('.td-click-to-copy', (els) => els.length),
      2,
      'one button per block',
    );
    assert.equal(
      await copyFromBlock(page, 0),
      block.copied,
      'block copies its source',
    );
    assert.equal(
      await copyFromBlock(page, 1),
      hookBlock.copied,
      'hook block copies its source',
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await close();
  }
});
