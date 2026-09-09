// The plugin architecture's acceptance test: a project site adds one asset
// and one registry entry, zero layout overrides. Rationale:
// https://www.docsy.dev/project/quality/script-loading/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildSite } from './lib/build-site.mjs';

test('a project adds a plugin with zero layout overrides', () => {
  const r = buildSite('plugins-acceptance', {
    files: {
      'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
      'assets/js/plugins/hello.js':
        "console.log('hello from a project plugin');\n",
    },
    extraConfig: `params:
  docsy:
    plugins:
      hello:
        enable: true
`,
  });
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
  assert.ok(
    !existsSync(path.join(r.site, 'layouts')),
    'the fixture site is layout-override-free',
  );
  const html = r.publicFile('index.html');
  const m = html.match(/<script[^>]*src="\/(js\/plugins\/hello[^"]*\.js)"/);
  assert.ok(m, 'the project plugin is loaded');
  assert.match(
    r.publicFile(m[1]),
    /hello from a project plugin/,
    'project asset is the built module',
  );
});
