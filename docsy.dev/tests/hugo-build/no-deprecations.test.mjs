import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = fileURLToPath(new URL('../../', import.meta.url));
const tmpDir = join(siteDir, 'tmp');

// Build the real site to a throwaway destination under the gitignored `tmp/` so
// this probe build never clobbers the published `public/` that `test:base`
// produces and other tests (e.g. published-head) read.
function buildSite() {
  mkdirSync(tmpDir, { recursive: true });
  const destDir = mkdtempSync(join(tmpDir, 'no-deprecations-'));
  try {
    // The trailing --logLevel info makes today's script chain run Hugo at
    // info (last flag wins); the Hugo-INFO-records assertion below proves the
    // executed Hugo really did, so a chain change that swallows the flag
    // fails red instead of silently muting deprecations. The probe does not
    // depend on (or enforce) the _hugo script's own level.
    const res = spawnSync(`npm run build -- -d "${destDir}" --logLevel info`, {
      cwd: siteDir,
      shell: true,
      encoding: 'utf8',
    });
    const output = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
    // Catches INFO-level deprecation notices (--logLevel info): Hugo API
    // deprecations and any deprecation warning that escapes the theme's
    // silencing, e.g. through a config regression (guard split: see maintainer
    // notes, "Sass deprecation warnings"). WARN-level messages fail the status
    // assertion instead: `npm run build` runs with --panicOnWarning.
    const deprecations = output
      .split('\n')
      .filter((line) => /deprecated/i.test(line));
    return { res, output, deprecations };
  } finally {
    rmSync(destDir, { recursive: true, force: true });
  }
}

test('site build logs no deprecation notices', (t) => {
  const { res, output, deprecations } = buildSite();
  assert.equal(res.status, 0, `site build exits 0; output:\n${output}`);
  assert.ok(
    /^INFO {2}(build|static):/m.test(output),
    'the executed Hugo ran at info level (Hugo INFO records present)',
  );
  assert.deepEqual(
    deprecations,
    [],
    'build log is free of deprecation notices',
  );
  t.diagnostic(`Scanned ${output.split('\n').length} build-log lines`);
});
