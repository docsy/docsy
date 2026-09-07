// Runtime JS console-error net (google/docsy#1436): loads representative
// fixture-site pages in a real browser and asserts that no uncaught
// exception or in-scope console error fires. Needs network access (real
// CDN deps). Rationale and particulars:
// https://www.docsy.dev/project/quality/script-loading/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildSite } from '../fixture-site/lib/build-site.mjs';
import { launchBrowser, serveDir } from './lib/harness.mjs';

const files = {
  // Tall section below the cover: the transparency probe needs the home
  // page to scroll well past the navbar.
  'content/_index.md':
    '---\ntitle: Home\n---\n{{< blocks/cover >}}\nCover\n{{< /blocks/cover >}}\n{{% blocks/section %}}\n' +
    'Tall content paragraph.\n\n'.repeat(60) +
    '{{% /blocks/section %}}\n',
  'content/docs/_index.md':
    '---\ntitle: Docs\nmenu: { main: { weight: 10 } }\n---\nDocs landing\n',
  'content/docs/tabs.md': `---
title: Tabs
---

{{< tabpane text=true >}}
{{< tab header="One" >}}one{{< /tab >}}
{{< tab header="Two" >}}two{{< /tab >}}
{{< /tabpane >}}

\`\`\`sh
echo hi
\`\`\`
`,
  'content/docs/diagrams.md': `---
title: Diagrams
---

\`\`\`mermaid
graph LR;
  A-->B;
\`\`\`

\`\`\`markmap
# Root

## Child
\`\`\`

\`\`\`plantuml
Alice -> Bob: hello
\`\`\`
`,
};

// One variant per search bundle. Pages are static so the test list registers
// up front; each variant's server origin resolves in before().
const variants = {
  features: {
    options: {
      files,
      // The crowded main menu overflows the desktop navbar, arming
      // base.js's scroll-indicator logic.
      extraConfig: `menus:
  main:
${Array.from(
  { length: 12 },
  (_, i) => `    - name: Menu entry number ${i + 1}
      url: https://example.org/${i + 1}
      weight: ${i + 1}
`,
).join('')}params:
  offlineSearch: true
  docsy:
    plugins:
      markmap: { enable: true }
  plantuml:
    enable: true
`,
    },
    pages: ['', 'docs/', 'docs/diagrams/', 'docs/tabs/'],
  },
  // gcs_engine_id renders the navbar search input, arming search.js's
  // delegated Enter handler (the offline variant swaps that file out).
  // Doubles as the plantuml svg-mode site (features covers img mode).
  'gcs-search': {
    options: {
      files,
      extraConfig: `params:
  gcs_engine_id: fake
  plantuml:
    enable: true
    svg: true
`,
    },
    pages: ['docs/', 'docs/diagrams/'],
  },
};

const visits = Object.entries(variants).flatMap(([variant, { pages }]) =>
  pages.map((page) => ({ variant, page })),
);

let browser;
const servers = {}; // variant → { origin, close }
const builds = {}; // variant → buildSite result
let selfTestUrl;
let checked = 0;

before(async () => {
  for (const [variant, { options }] of Object.entries(variants)) {
    const build = buildSite(`js-runtime-${variant}`, options);
    if (build.status !== 0) {
      throw new Error(
        `fixture hugo build failed:\n${build.stdout}${build.stderr}`,
      );
    }
    builds[variant] = build;
    servers[variant] = await serveDir(path.join(build.site, 'public'));
    if (!selfTestUrl) {
      // Self-test page for the collector's red-proof: an uncaught
      // exception and a missing same-origin script, both must be caught.
      writeFileSync(
        path.join(build.site, 'public', 'js-runtime-selftest.html'),
        '<!doctype html><title>self-test</title>\n' +
          '<script>throw new Error("selftest: deliberate exception");</script>\n' +
          '<script src="/js-runtime-selftest-missing.js"></script>\n',
      );
      selfTestUrl = `${servers[variant].origin}/js-runtime-selftest.html`;
    }
  }
  browser = await launchBrowser();
});

after(async () => {
  await Promise.all([
    browser?.close(),
    ...Object.values(servers).map((s) => s.close()),
  ]);
  // Sanity floor: an emptied visit list or all-skipped run exits 0, so
  // green must mean every page visit actually ran.
  assert.ok(visits.length > 0, 'visit list is non-empty');
  assert.equal(checked, visits.length, 'every page visit executed');
});

// Load a page and collect JS failures: uncaught exceptions (pageerror)
// and console-level errors, filtered per the quality page (URL above).
// Bounded window: errors scheduled well after the settle delay are out of
// scope here; interaction probes carry their own collectors.
async function collectPageErrors(url) {
  const origin = new URL(url).origin;
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Failed to load resource/.test(text)) {
      const resUrl = msg.location()?.url ?? '';
      if (resUrl.startsWith(origin) && /\.(js|mjs|css)(\?|$)/.test(resUrl)) {
        errors.push(`console.error: same-origin resource failed: ${resUrl}`);
      }
      return;
    }
    errors.push(`console.error: ${text}`);
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    // Let ready handlers and async module scripts settle.
    await new Promise((resolve) => setTimeout(resolve, 250));
  } finally {
    await page.close();
  }
  return errors;
}

// Collector self-test (red-proof rationale: the quality page, URL above).
test('js-runtime collector: an uncaught page exception is reported', async () => {
  const errors = await collectPageErrors(selfTestUrl);
  assert.ok(
    errors.some((e) => e.includes('selftest: deliberate exception')),
    'collector reports the deliberate exception',
  );
  assert.ok(
    errors.some((e) => e.includes('js-runtime-selftest-missing.js')),
    'collector reports the missing same-origin script',
  );
});

for (const { variant, page } of visits) {
  test(`js runtime: ${variant} /${page} loads without JS errors`, async () => {
    const errors = await collectPageErrors(
      `${servers[variant].origin}/${page}`,
    );
    checked += 1;
    assert.deepEqual(errors, [], `${variant} /${page} loads without JS errors`);
  });
}

// Behavior probes: one parity assertion per script the theme converted
// (jQuery removal, google/docsy#1436; plugin conversions, 0.18).

// Interaction probes carry their own pageerror collector: an exception
// thrown by a handler mid-probe must fail the probe, not vanish once the
// asserted state change has landed.
async function newProbePage() {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  return { page, pageErrors };
}

// The fixture-site nets stay offline, so the real vendor fetch (a
// resources.GetRemote of the autoloader) is pinned here, in the network tier.
test('markmap vendors the autoloader same-origin, with SRI, deferred', () => {
  const html = builds.features.publicFile('docs/diagrams/index.html');
  assert.doesNotMatch(
    html,
    /<script[^>]*src="https?:\/\/[^"]*markmap/i,
    'page is free of cross-origin markmap script tags',
  );
  const vendor = html.match(
    /<script[^>]*src="\/js\/vendor\/markmap-autoloader[^"]*\.js"[^>]*>/,
  );
  assert.ok(vendor, 'vendored autoloader is served same-origin');
  assert.match(
    vendor[0],
    /integrity="sha256-/,
    'vendored autoloader carries SRI',
  );
  assert.match(
    vendor[0],
    /\bdefer\b/,
    'autoloader defers past the plugin script that configures it',
  );
});

test('js behavior: a markmap code block renders as an SVG mind map', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.goto(`${servers.features.origin}/docs/diagrams/`, {
      waitUntil: 'networkidle0',
    });
    const svg = await page.waitForSelector('.markmap svg', { timeout: 15000 });
    assert.ok(svg, 'markmap SVG is in the DOM');
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: the copy button is added to code blocks', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.goto(`${servers.features.origin}/docs/tabs/`, {
      waitUntil: 'networkidle0',
    });
    const button = await page.waitForSelector('.highlight .td-click-to-copy', {
      timeout: 5000,
    });
    assert.ok(button, 'a copy button is in the code block');
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: a selected tab is re-selected after reload', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    const url = `${servers.features.origin}/docs/tabs/`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.click('[data-td-tp-persist="two"]');
    await page.goto(url, { waitUntil: 'networkidle0' });
    const active = await page.$eval('.nav-tabs .nav-link.active', (el) =>
      el.getAttribute('data-td-tp-persist'),
    );
    assert.equal(active, 'two', 'persisted tab is active after reload');
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: a plantuml code block becomes a diagram-server image', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.goto(`${servers.features.origin}/docs/diagrams/`, {
      waitUntil: 'networkidle0',
    });
    // A loaded payload (not just the element) pins the deflate + encode64
    // pipeline end-to-end: a corrupt encoding 404s at the diagram server.
    const naturalWidth = await page.$eval(
      'img[src*="plantuml.com/plantuml/svg/"]',
      (img) =>
        img.complete
          ? img.naturalWidth
          : new Promise((resolve) => {
              img.addEventListener('load', () => resolve(img.naturalWidth));
              img.addEventListener('error', () => resolve(-1));
            }),
    );
    assert.ok(naturalWidth > 0, 'plantuml image payload loaded');
    assert.equal(
      await page.$('.language-plantuml'),
      null,
      'the plantuml code block was replaced',
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: plantuml svg mode emits an SVG-namespace loader element', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.goto(`${servers['gcs-search'].origin}/docs/diagrams/`, {
      waitUntil: 'networkidle0',
    });
    // external-svg-loader targets svg[data-src]; the element must be a
    // real SVG-namespace element like the one the HTML parser produced.
    const ns = await page.$eval(
      'svg[data-src*="plantuml.com/plantuml/svg/"]',
      (el) => el.namespaceURI,
    );
    assert.equal(ns, 'http://www.w3.org/2000/svg', 'SVG namespace');
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

// Mermaid's rendered SVG embeds a theme-derived <style>; the light probe
// captures it so the dark probe can assert the theme sniff actually
// changed the rendering, not merely that an SVG appeared.
let mermaidLightStyle;

test('js behavior: a mermaid code block renders as an SVG diagram', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.goto(`${servers.features.origin}/docs/diagrams/`, {
      waitUntil: 'networkidle0',
    });
    await page.waitForSelector('.mermaid svg', { timeout: 15000 });
    mermaidLightStyle = await page.$eval(
      '.mermaid svg',
      (svg) => svg.querySelector('style')?.textContent ?? '',
    );
    assert.ok(mermaidLightStyle, 'mermaid SVG carries its theme style');
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: mermaid renders with the dark theme under data-bs-theme=dark', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    // The dark-theme sniff reads data-bs-theme when the mermaid module
    // runs; the attribute must land before that. DOMContentLoaded is too
    // late for a cache-hot async module, so set it as soon as the
    // document element exists.
    await page.evaluateOnNewDocument(() => {
      new MutationObserver((_, observer) => {
        if (!document.documentElement) return;
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        observer.disconnect();
      }).observe(document, { childList: true });
    });
    await page.goto(`${servers.features.origin}/docs/diagrams/`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('.mermaid svg', { timeout: 15000 });
    const darkStyle = await page.$eval(
      '.mermaid svg',
      (svg) => svg.querySelector('style')?.textContent ?? '',
    );
    assert.ok(darkStyle, 'mermaid SVG carries its theme style');
    assert.notEqual(
      darkStyle,
      mermaidLightStyle,
      'dark-theme rendering differs from the light rendering',
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

// offline-search probe: committing a query must pop the results popover;
// closing it must clear the input.

test('js behavior: an offline-search query pops the results popover and close clears it', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${servers.features.origin}/docs/`, {
      waitUntil: 'networkidle0',
    });
    const input = await page.$('.td-search--offline input');
    assert.ok(input, 'offline-search input is present');
    await input.type('docs');
    await input.press('Enter');
    await page.waitForSelector('.td-offline-search-results', {
      timeout: 10000,
    });
    // The close handler arms on shown.bs.popover, after the fade
    // transition; retry the click until the handler has taken effect
    // (a fixed settle delay flakes under full-suite load).
    const deadline = Date.now() + 10000;
    let cleared = false;
    while (!cleared && Date.now() < deadline) {
      try {
        await page.click('.td-offline-search-results__close-button');
      } catch {
        // Popover mid-transition (node detached or not yet clickable);
        // the retry loop tries again.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
      cleared = await page.$eval(
        '.td-search--offline input',
        (el) => el.value === '',
      );
    }
    assert.ok(cleared, 'the close button cleared the search input');
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

// base.js probes: the cover-transparency feature lives in desktop chrome;
// the nav-overflow feature is mobile-only (the nav only clips below the
// lg breakpoint), so its probe uses a narrow viewport.

test('js behavior: the navbar is transparent over the cover and solid after scrolling past it', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(servers.features.origin, { waitUntil: 'networkidle0' });
    const isTransparent = () =>
      page.$eval('.js-navbar-scroll', (el) =>
        el.classList.contains('td-navbar-transparent'),
      );
    assert.equal(await isTransparent(), true, 'navbar is transparent at top');
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForFunction(
      () =>
        !document
          .querySelector('.js-navbar-scroll')
          .classList.contains('td-navbar-transparent'),
      { timeout: 5000 },
    );
    assert.equal(
      await isTransparent(),
      false,
      'navbar is solid after scrolling past the cover',
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: an overflowing navbar menu shows scroll indicators and scrolls on click', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    await page.setViewport({ width: 500, height: 800 });
    await page.goto(`${servers.features.origin}/docs/`, {
      waitUntil: 'networkidle0',
    });
    assert.equal(
      await page.$eval('#main_navbar', (el) =>
        el.classList.contains('td-navbar-nav-scroll--indicator'),
      ),
      true,
      'overflow indicator class is set on the navbar',
    );
    assert.equal(
      await page.$eval('.td-navbar-container', (el) =>
        el.classList.contains('navbar-is-overflowing'),
      ),
      true,
      'overflow class is set on the navbar container',
    );
    await page.click('#main_navbar .scroll-right');
    await page.waitForFunction(
      () => document.querySelector('.navbar-nav').scrollLeft > 0,
      { timeout: 5000 },
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});

test('js behavior: Enter in the navbar search box navigates to the search page', async () => {
  const { page, pageErrors } = await newProbePage();
  try {
    // Desktop viewport: in collapsed (mobile) chrome the navbar search
    // input is unfocusable, and typing would land on <body>.
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${servers['gcs-search'].origin}/docs/`, {
      waitUntil: 'networkidle0',
    });
    const input = await page.$('.td-search input');
    assert.ok(input, 'navbar search input is present');
    // The handler navigates via absURL (the fixture's example.org base), so
    // intercept the navigation instead of following it off-origin.
    let searchNav;
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.isNavigationRequest()) {
        searchNav = req.url();
        return req.abort();
      }
      req.continue();
    });
    // Reserved URL characters pin the query encoding: unencoded, & and #
    // truncate the q param.
    await input.type('docsy&nav#2');
    await input.press('Enter');
    // The navigation request fires async; poll briefly for it.
    for (let i = 0; i < 40 && searchNav === undefined; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.match(
      searchNav ?? '',
      /\/search\/\?q=docsy%26nav%232$/,
      'Enter navigates to the search page with the encoded query',
    );
    assert.deepEqual(pageErrors, [], 'probe ran without page errors');
  } finally {
    await page.close();
  }
});
