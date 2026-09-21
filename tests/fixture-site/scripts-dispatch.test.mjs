// Dispatch net: scripts.html keeps dispatching the .Page.Store-gated katex
// partial, pinned offline through a marker override.
// Rationale: https://www.docsy.dev/project/quality/script-loading/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './lib/build-site.mjs';

const r = buildSite('scripts-dispatch', {
  files: {
    'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
    'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
    'content/docs/math.md':
      '---\ntitle: Math\n---\n{{< set-flag hasMath >}}\nMath body\n',
    'layouts/_shortcodes/set-flag.html': '{{ .Page.Store.Set (.Get 0) true }}',
    'layouts/_partials/scripts/katex.html':
      '<div data-dispatch="katex"></div>\n',
  },
});

test('the dispatch fixture builds', () => {
  assert.equal(r.status, 0, `hugo build succeeds:\n${r.stderr}`);
});

test('the katex partial is dispatched on flagged pages only', () => {
  assert.match(
    r.publicFile('docs/math/index.html'),
    /data-dispatch="katex"/,
    'flagged page carries the katex dispatch',
  );
  for (const page of ['index.html', 'docs/index.html']) {
    assert.doesNotMatch(
      r.publicFile(page),
      /data-dispatch/,
      `${page} is dispatch-free`,
    );
  }
});
