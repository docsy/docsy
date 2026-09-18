// jQuery-absence gate (docsy#1436): the theme ships and loads no
// jQuery. Locks the removal in two layers: rendered pages reference no
// jquery script, and authored theme JS (assets, plugins included, and
// inline layout scripts) contains no jQuery usage tokens. theme/static/js/
// (prism.js, deflate.js) is out of scope: vendored third-party bundles,
// upstream-owned and jQuery-free by their own contract.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import { buildSite } from './lib/build-site.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

test('rendered pages reference no jquery script', () => {
  const build = buildSite('no-jquery', {
    title: 'Docsy absence-gate fixture',
    files: {
      'content/_index.md': '---\ntitle: Home\n---\nHome body\n',
      'content/docs/_index.md': '---\ntitle: Docs\n---\nDocs body\n',
    },
    // offlineSearch exercises the fuller head (lunr script wiring).
    extraConfig: 'params:\n  offlineSearch: true\n',
  });
  assert.equal(build.status, 0, 'fixture site builds');
  for (const page of ['index.html', 'docs/index.html']) {
    assert.doesNotMatch(
      build.publicFile(page),
      /jquery/i,
      `${page} is jquery-free`,
    );
  }
});

test('authored theme JS contains no jQuery usage', () => {
  // Usage tokens, not mentions: calls, member access, aliasing, and the
  // classic IIFE argument. Prose references in comments stay legal.
  const jsUsage = /\$\s*[.(]|jQuery\s*[.([]|\(\s*jQuery\s*\)|=\s*jQuery\b/;
  // Category-specific scans with independent floors: a silently emptied
  // glob in one category can't hide behind another's file count.
  const scans = [
    {
      name: 'theme JS assets',
      files: globSync('theme/assets/js/*.js', { cwd: repoRoot }),
      floor: 8,
      re: jsUsage,
    },
    {
      name: 'theme JS plugins',
      files: globSync('theme/assets/js/plugins/*.js', { cwd: repoRoot }),
      floor: 3,
      re: jsUsage,
    },
    {
      name: 'theme layouts',
      files: globSync('theme/layouts/**/*.html', { cwd: repoRoot }),
      floor: 30,
      // Hugo templates use $.Site and kin, so the JS token scan can't
      // apply; match inline-script usage tokens and jquery script URLs.
      re: /\$\(|jQuery\s*[.(]|\(jQuery\)|code\.jquery\.com|jquery[^"'\s]*\.m?js\b/i,
    },
  ];
  for (const { name, files, floor, re } of scans) {
    assert.ok(
      files.length >= floor,
      `the ${name} scan found at least ${floor} files`,
    );
    for (const rel of files) {
      assert.doesNotMatch(
        readFileSync(path.join(repoRoot, rel), 'utf8'),
        re,
        `${rel} is free of jQuery usage`,
      );
    }
  }
});
