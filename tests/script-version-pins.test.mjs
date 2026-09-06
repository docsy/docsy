// Docsy's default versions of CDN-loaded script dependencies (Mermaid,
// KaTeX, markmap-autoloader, Redoc) must stay exact, pinned X.Y.Z values
// (see maintainer notes, "Default script-dependency versions"). Fast and
// offline.
//
// The YAML assertions catch non-exact theme pins directly, without building
// a site. Template-side assertions are a lint against carelessly reintroducing
// a fallback or hardcoded version, not a boundary against deliberate evasion:
// code review owns that.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const SEMVER = /^\d+\.\d+\.\d+$/;

const siteParam = (name) => ({
  key: `params.${name}.version`,
  value: (config) => config?.params?.[name]?.version,
  read: String.raw`\$version := \.Site\.Params\.${name}\.version \| string \| strings\.TrimSpace`,
});
const pluginEntry = (name) => ({
  key: `params.docsy.plugins.${name}.version`,
  value: (config) => config?.params?.docsy?.plugins?.[name]?.version,
  read: String.raw`\$version := \.Plugin\.version`,
});

const PINS = [
  {
    pin: siteParam('mermaid'),
    template: 'theme/layouts/_partials/scripts/mermaid.html',
    cdnPackage: 'mermaid',
    // How the template interpolates $version into its CDN URL: a printf
    // format (%s) or a literal src ({{ $version }}). Row-specific so a
    // literal-src template can't pass with an inert %s.
    urlForm: '%s',
  },
  {
    pin: siteParam('katex'),
    template: 'theme/layouts/_partials/scripts/katex.html',
    cdnPackage: 'katex',
    urlForm: '%s',
  },
  {
    pin: pluginEntry('markmap'),
    // The pin feeds the vendor fetch (the companion partial), not a
    // browser-facing CDN tag.
    template: 'theme/layouts/_partials/scripts/plugins/markmap.html',
    cdnPackage: 'markmap-autoloader',
    urlForm: '%s',
  },
  {
    pin: siteParam('redoc'),
    template: 'theme/layouts/_shortcodes/redoc.html',
    cdnPackage: 'redoc',
    urlForm: '{{ $version }}',
  },
];

const themeConfig = parse(
  fs.readFileSync(path.join(repoRoot, 'theme/hugo.yaml'), 'utf8'),
);

for (const { pin, template, cdnPackage, urlForm } of PINS) {
  test(`theme/hugo.yaml pins an exact ${cdnPackage} version`, () => {
    const version = pin.value(themeConfig);
    assert.ok(
      version !== undefined,
      `${pin.key} is declared in theme/hugo.yaml`,
    );
    assert.equal(typeof version, 'string', `${pin.key} is a string`);
    // Prerelease pins (X.Y.Z-rc.N) are deliberately rejected: the theme
    // default stays on stable releases. Sites can still pin one; they get the
    // suppressible non-exact-version warning.
    assert.match(
      version,
      SEMVER,
      `${pin.key} is X.Y.Z, not a value like \`latest\``,
    );
  });

  test(`the ${cdnPackage} template takes its version from the config param alone`, () => {
    const text = fs.readFileSync(path.join(repoRoot, template), 'utf8');
    assert.match(
      text,
      new RegExp(pin.read),
      `the template reads ${pin.key} bare, first in its pipeline`,
    );
    // Both `| default` (pipe form) and `default "x" .Site...` (call form);
    // the argument shape keeps prose mentions of "default" out of scope.
    assert.doesNotMatch(
      text,
      /\bdefault\s+["'`([\d$.]/,
      'the version read is fallback-free, in pipe and call form alike',
    );
    const urlFormPattern = urlForm.replace(/[${}()|[\]\\]/g, '\\$&');
    assert.match(
      text,
      new RegExp(String.raw`${cdnPackage}@${urlFormPattern}`),
      'the CDN URL interpolates the configured version',
    );
    assert.doesNotMatch(
      text,
      new RegExp(String.raw`${cdnPackage}@(?!${urlFormPattern})`),
      'CDN URLs carry no hardcoded version',
    );
  });
}
