// Framework-class lint for the semantic-classes migration
// (docsy#783): class attributes in cleared partials carry no literal
// Bootstrap class names. The rendered-output net
// (fixture-site/output-classes.test.mjs) is ground truth for every branch
// the fixture exercises; this lint's job is the residue — branch literals
// the fixture doesn't render — caught as plain tokens in the template text.
// A deliberate lint, not a boundary (per the repo's runner-lint stance):
// assembled or computed class names are review's job. It replaces a
// ~770-line template scanner that re-modeled Hugo's evaluator; history and
// rationale in docsy#2719 and its retirement PR.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrapClasses, bootstrapCss } from './lib/bootstrap-inventory.mjs';
import { CLEARED_PARTIALS } from './lib/cleared-partials.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

// Literal tokens in class attributes: the attribute value is taken as raw
// text (Go-template actions included) and split into class-name-shaped
// words, so a branch literal ({{ if .X }}active{{ end }}) surfaces as
// `active`. A quote inside an action ({{ eq .Status "active" }}) does not
// end the attribute, so the walk skips {{…}} spans when looking for the
// closing quote. Only double-quoted attributes are scanned — the theme
// emits nothing else, and the output net lexes the other forms.
// Over-matching is loud, never silent: a non-class literal that
// collides with a Bootstrap name fails the lint and gets renamed or
// restructured, it doesn't hide anything.

// Index just past the `}}` closing the action opened at `open`: a `}}`
// inside a comment or a quoted string does not close the action (the
// retired scanner's actionClose semantics). An unterminated action or
// string runs the span to the template's end, which is then tokenized
// raw: the loud direction.
const actionEnd = (template, open) => {
  let i = open + 2;
  if (/^\s*-?\s*\/\*/.test(template.slice(i, i + 8))) {
    const comment = template.indexOf('*/', i);
    const close = comment === -1 ? -1 : template.indexOf('}}', comment);
    return close === -1 ? template.length : close + 2;
  }
  for (; i < template.length; i += 1) {
    const c = template[i];
    if (c === '"' || c === "'") {
      i += 1;
      while (i < template.length && template[i] !== c) {
        i += template[i] === '\\' ? 2 : 1;
      }
    } else if (c === '`') {
      i = template.indexOf('`', i + 1);
      if (i === -1) return template.length;
    } else if (c === '}' && template[i + 1] === '}') {
      return i + 2;
    }
  }
  return template.length;
};

export function classTokens(template) {
  const tokens = new Set();
  const openRe = /\bclass\s*=\s*"/gi;
  for (let m; (m = openRe.exec(template));) {
    const start = m.index + m[0].length;
    let end = start;
    while (end < template.length && template[end] !== '"') {
      end = template.startsWith('{{', end) ? actionEnd(template, end) : end + 1;
    }
    for (const t of template.slice(start, end).match(/-?[_a-zA-Z][\w-]*/g) ??
      []) {
      tokens.add(t);
    }
    // Rescan from just inside the span: a false opener (class=" text in
    // some other attribute's value) must not consume a real one its span
    // happens to cover. Overlapping spans over-match, which is loud.
    openRe.lastIndex = start;
  }
  return tokens;
}

test('framework-class lint: cleared partials name no Bootstrap classes', () => {
  assert.ok(
    fs.existsSync(bootstrapCss),
    'bootstrap.css is installed (npm run install:theme-deps)',
  );
  const inventory = bootstrapClasses(fs.readFileSync(bootstrapCss, 'utf8'));
  assert.ok(inventory.size > 500, 'inventory parsed a full Bootstrap build');

  // Self-test: a broken tokenizer plus an empty cleared list would
  // otherwise stay green forever. The nested-quote case is a real Hugo
  // form that truncates a naive attribute regex.
  assert.deepEqual(
    [
      ...classTokens(
        '<nav class="td-x d-flex{{ if .Active }} active{{ end }}">',
      ),
    ].filter((t) => inventory.has(t)),
    ['d-flex', 'active'],
    'branch and literal Bootstrap tokens are flagged',
  );
  assert.deepEqual(
    [
      ...classTokens(
        '<li class="breadcrumb-item{{ if eq .Status "active" }} active{{ end }}">',
      ),
    ].filter((t) => inventory.has(t)),
    ['breadcrumb-item', 'active'],
    'a quote inside an action does not truncate the attribute scan',
  );
  assert.ok(
    classTokens('<div class="{{ if eq .X "}}" }} d-flex{{ end }} td-x">').has(
      'd-flex',
    ),
    'a }} inside an action string does not end the action skip',
  );
  assert.ok(
    classTokens('<div data-example=\'class="\' class="d-flex td-x">').has(
      'd-flex',
    ),
    'a class= in another attribute value does not consume the real attribute',
  );

  for (const partial of CLEARED_PARTIALS) {
    const file = path.join(repoRoot, 'theme/layouts', partial);
    assert.ok(fs.existsSync(file), `cleared partial ${partial} exists`);
    const source = fs.readFileSync(file, 'utf8');
    assert.deepEqual(
      [...classTokens(source)].filter((t) => inventory.has(t)).sort(),
      [],
      `${partial} class attributes name only Docsy-owned classes`,
    );
  }
});
