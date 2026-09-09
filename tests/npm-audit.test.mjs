// Online npm-audit gate, complementing the offline structural checks in
// supply-chain-audit.test.mjs: committed locks stay free of unreviewed
// advisories. Accepted advisories stay listed below and must still be
// reported; once one disappears, its exception is stale.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const acceptedAdvisories = new Map([
  // No fixed version. Reached only by hugo-extended's Windows postinstall,
  // extracting a checksum-verified Hugo release into its own
  // node_modules/hugo-extended/bin: dev-only, and the advisory's
  // destination-symlink precondition implies an already-compromised tree.
  ['GHSA-vwc7-r8mq-g2x9', 'adm-zip'],
]);

function validateAuditGate(report, accepted) {
  // Fail-closed on npm audit format changes (currently v2).
  assert.equal(report.auditReportVersion, 2, 'npm audit report format is v2');
  assert.equal(report.error, undefined, 'npm audit reached the registry');
  assert.ok(
    report.metadata?.dependencies?.total > 0,
    'the audit covered the installed dependency tree',
  );

  const reported = new Map();
  const allVulns = report.vulnerabilities ?? {};

  for (const [name, vuln] of Object.entries(allVulns)) {
    for (const via of vuln.via) {
      if (via == null || typeof via !== 'object') {
        // String via entries chain to another reported finding.
        if (typeof via === 'string') {
          assert.ok(
            Object.hasOwn(allVulns, via),
            `string via "${via}" on ${name} resolves to a reported vulnerability`,
          );
          continue;
        }
        assert.fail(
          `via entries are advisory objects or chain strings; got ${typeof via} on ${name} (${JSON.stringify(via)})`,
        );
      }
      const ghsa = via.url?.match(/GHSA-[a-z0-9-]+$/)?.[0] ?? via.url;
      reported.set(ghsa, via.name ?? name);
      assert.ok(
        accepted.has(ghsa),
        `${ghsa} (${via.severity}, ${name}: ${via.title}) is a reviewed, accepted advisory`,
      );
    }
  }

  for (const [ghsa, pkg] of accepted) {
    assert.equal(
      reported.get(ghsa),
      pkg,
      `accepted advisory ${ghsa} remains reported for ${pkg}, keeping its exception earned`,
    );
  }
}

test('audit: reported advisories are reviewed and accepted', () => {
  const res = spawnSync('npm', ['audit', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  if (res.error) {
    assert.fail(`npm audit failed to run: ${res.error.message}`);
  }
  let report;
  try {
    report = JSON.parse(res.stdout);
  } catch {
    assert.fail(
      `npm audit emitted invalid JSON (exit ${res.status}): ${
        res.stderr || res.stdout
      }`,
    );
  }
  validateAuditGate(report, acceptedAdvisories);
});

// Fixture-local accepted map, so the parser checks don't depend on the live
// exception list.
const fixtureAccepted = new Map([['GHSA-aaaa-bbbb-cccc', 'accepted-package']]);

test('audit gate: parser rejects unreviewed advisories', () => {
  const validReport = {
    auditReportVersion: 2,
    error: undefined,
    metadata: { dependencies: { total: 1 } },
    vulnerabilities: {
      'package-a': {
        name: 'package-a',
        via: [
          {
            url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
            severity: 'critical',
            name: 'accepted-package',
            title: 'Malware',
          },
        ],
      },
    },
  };
  validateAuditGate(validReport, fixtureAccepted);
});

test('audit gate: parser rejects unaccepted advisories', () => {
  const reportWithNewGHSA = {
    auditReportVersion: 2,
    error: undefined,
    metadata: { dependencies: { total: 1 } },
    vulnerabilities: {
      'package-b': {
        name: 'package-b',
        via: [
          {
            url: 'https://github.com/advisories/GHSA-xxxx-yyyy-zzzz',
            severity: 'high',
            name: 'unreviewed-advisory',
            title: 'New advisory',
          },
        ],
      },
    },
  };
  assert.throws(
    () => validateAuditGate(reportWithNewGHSA, fixtureAccepted),
    /GHSA-xxxx-yyyy-zzzz.*reviewed, accepted advisory/,
  );
});

test('audit gate: parser rejects stale exceptions (missing report)', () => {
  const reportWithoutAcceptedGHSA = {
    auditReportVersion: 2,
    error: undefined,
    metadata: { dependencies: { total: 1 } },
    vulnerabilities: {},
  };
  assert.throws(
    () => validateAuditGate(reportWithoutAcceptedGHSA, fixtureAccepted),
    /accepted advisory GHSA-aaaa-bbbb-cccc remains reported/,
  );
});

test('audit gate: parser rejects format version changes', () => {
  const reportV3 = {
    auditReportVersion: 3,
    error: undefined,
    metadata: { dependencies: { total: 1 } },
    vulnerabilities: {},
  };
  assert.throws(
    () => validateAuditGate(reportV3, fixtureAccepted),
    /report format is v2/,
  );
});

test('audit gate: parser rejects string via without chain target', () => {
  const reportWithDanglingStringVia = {
    auditReportVersion: 2,
    error: undefined,
    metadata: { dependencies: { total: 1 } },
    vulnerabilities: {
      'package-c': {
        name: 'package-c',
        via: ['nonexistent-key'],
      },
    },
  };
  assert.throws(
    () => validateAuditGate(reportWithDanglingStringVia, fixtureAccepted),
    /string via "nonexistent-key".*resolves to a reported vulnerability/,
  );
});

test('audit gate: parser accepts valid transitive advisory chain', () => {
  const reportWithTransitiveChain = {
    auditReportVersion: 2,
    error: undefined,
    metadata: { dependencies: { total: 2 } },
    vulnerabilities: {
      'package-a': {
        name: 'package-a',
        via: ['package-b'],
      },
      'package-b': {
        name: 'package-b',
        via: [
          {
            url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
            severity: 'critical',
            name: 'accepted-package',
            title: 'Malware',
          },
        ],
      },
    },
  };
  validateAuditGate(reportWithTransitiveChain, fixtureAccepted);
});
