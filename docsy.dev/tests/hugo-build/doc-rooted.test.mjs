// The doc-rooted variant (config/doc-rooted), built in both chrome modes: full
// for llms.txt (docsy/docsy#2834), shared for the chrome donor page
// (theme-level fixture in tests/fixture-site/chrome-doc-rooted).

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome } from '../../../tests/fixture-site/lib/fixtures.mjs';

const siteDir = fileURLToPath(new URL('../../', import.meta.url));
const tmpDir = join(siteDir, 'tmp');

// One build per chrome mode, each to a throwaway destination so the published
// public/ that test:base produces stays intact.
const dest = {};
const file = (mode, rel) => readFileSync(join(dest[mode], rel), 'utf8');
before(() => {
  mkdirSync(tmpDir, { recursive: true });
  for (const mode of ['full', 'shared']) {
    dest[mode] = mkdtempSync(join(tmpDir, `doc-rooted-${mode}-`));
    const res = spawnSync(`npm run build -- -d "${dest[mode]}"`, {
      cwd: siteDir,
      shell: true,
      encoding: 'utf8',
      env: {
        ...process.env,
        TD_BUILD_CTX: 'doc-rooted',
        HUGO_PARAMS_TD_CHROME: mode,
        BASE_URL: 'http://localhost',
      },
    });
    const output = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
    assert.equal(
      res.status,
      0,
      `doc-rooted ${mode} build exits 0; output:\n${output}`,
    );
    assert.ok(
      !/WARN/.test(output),
      `doc-rooted ${mode} build is warning-free; output:\n${output}`,
    );
  }
});
after(() => {
  for (const d of Object.values(dest))
    rmSync(d, { recursive: true, force: true });
});

test('doc-rooted variant publishes llms.txt at each language root only', () => {
  const llmsFiles = globSync('**/llms.txt', { cwd: dest.full })
    .map((f) => f.split(sep).join('/'))
    .sort();
  assert.deepEqual(llmsFiles, ['fr/llms.txt', 'llms.txt']);
  for (const [llms, home] of [
    ['llms.txt', 'index.md'],
    ['fr/llms.txt', 'fr/index.md'],
  ]) {
    const content = file('full', llms);
    assert.ok(
      content.startsWith('# Docsy\n'),
      `${llms} opens with the site title`,
    );
    assert.ok(
      content.includes(`- [Home page](http://localhost/${home})`),
      `${llms} links the root Markdown version as the home page`,
    );
  }

  for (const [page, llms] of [
    ['index.html', '/llms.txt'],
    ['fr/index.html', '/fr/llms.txt'],
  ]) {
    assert.ok(
      file('full', page).includes(
        `For AI agents: the site's llms.txt is at ${llms}`,
      ),
      `${page} directive points at ${llms}`,
    );
  }

  for (const f of [
    'index.html',
    'index.xml',
    'index.md',
    '_print/index.html',
  ]) {
    assert.ok(existsSync(join(dest.full, f)), `root publishes ${f}`);
  }
});

test('doc-rooted shared build keeps the navbar and footer on each language root', () => {
  for (const [root, donor] of [
    ['index.html', '/'],
    ['fr/index.html', '/fr/'],
  ]) {
    const h = file('shared', root);
    assert.ok(chrome.navbar(h), `navbar kept on the root page ${root}`);
    assert.ok(chrome.footer(h), `footer kept on the root page ${root}`);
    assert.ok(
      !chrome.placeholder(h, 'navbar', donor) &&
        !chrome.placeholder(h, 'footer', donor),
      `root page ${root} renders its chrome directly`,
    );
  }

  for (const inner of [
    'content/adding-content/index.html',
    '_print/index.html',
  ]) {
    const h = file('shared', inner);
    assert.ok(!chrome.navbar(h) && !chrome.footer(h), `${inner} drops both`);
    assert.ok(
      chrome.placeholder(h, 'navbar', '/') &&
        chrome.placeholder(h, 'footer', '/'),
      `${inner} placeholders name the root as donor page`,
    );
  }
});
