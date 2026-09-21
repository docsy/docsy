// Harness for the visual-regression suite: a loopback static server over a
// built fixture site, a Puppeteer page factory tuned for deterministic
// rendering, and a pixelmatch comparison against committed goldens.

import http from 'node:http';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import puppeteer from 'puppeteer';

const mime = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

export function serveDir(dir) {
  const root = realpathSync(path.resolve(dir));
  const server = http.createServer((req, res) => {
    let file = path.resolve(
      path.join(
        root,
        decodeURIComponent(new URL(req.url, 'http://x').pathname),
      ),
    );
    // Decoded dot-segments or in-root symlinks could escape the root;
    // realpath + jail-check the final candidate, again after a directory
    // resolves to its index file (the index itself may be a symlink).
    const jailed = (candidate) => {
      const real = realpathSync(candidate);
      if (real !== root && !real.startsWith(root + path.sep)) {
        throw Object.assign(new Error('outside root'), { status: 403 });
      }
      return real;
    };
    try {
      file = jailed(file);
      if (statSync(file).isDirectory()) {
        file = jailed(path.join(file, 'index.html'));
      }
    } catch (err) {
      // Any filesystem error besides the jail's 403 (missing file, EACCES)
      // is deliberately a plain 404: a test server needs no finer story.
      res.writeHead(err.status ?? 404).end();
      return;
    }
    res.writeHead(200, {
      'content-type': mime[path.extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        origin: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

export async function launchBrowser() {
  try {
    return await puppeteer.launch({
      // GitHub's Ubuntu runners restrict unprivileged user namespaces,
      // which breaks Chrome's sandbox; the fixture site is trusted content.
      args: process.env.CI ? ['--no-sandbox'] : [],
    });
  } catch (cause) {
    throw new Error(
      'Browser launch failed; if none is installed, run: npm run install:browser',
      { cause },
    );
  }
}

// Screenshot one region under a viewport and color scheme: an element's
// bounding box padded by `pad` CSS px (margins and neighbor spacing are
// outside the border box, so an unpadded element shot can't see them), or
// the full page when no selector is given (full, not viewport-clipped:
// the footer sits below the fold on short fixture pages). The theme's
// same-origin webfonts load and are awaited by the screenshot capture.
export async function shootRegion(
  browser,
  { url, selector, viewport, scheme, media, pad = 24 },
) {
  const page = await browser.newPage();
  try {
    await page.setViewport(viewport);
    // Media type and scheme must ride one CDP call: Puppeteer's
    // emulateMediaType and emulateMediaFeatures each send
    // Emulation.setEmulatedMedia with only its own field, wiping the
    // other's. The session stays attached: detaching reverts its overrides.
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setEmulatedMedia', {
      media: media ?? '',
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
    await page.setRequestInterception(true);
    const origin = new URL(url).origin;
    // Off-origin requests abort: deterministic, offline-safe shots.
    page.on('request', (req) =>
      req.url().startsWith(origin) ? req.continue() : req.abort(),
    );
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent =
        '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';
      document.head.append(style);
    });
    let options = { type: 'png', fullPage: !selector };
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`selector not found: ${selector} at ${url}`);
      }
      const box = await element.boundingBox();
      if (!box) throw new Error(`no bounding box: ${selector} at ${url}`);
      // Clamp each edge independently against the page bounds: clamping
      // only the origin would shift the crop instead of shrinking it, and
      // Puppeteer accepts out-of-bounds clips silently.
      const bounds = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));
      const x = Math.max(0, box.x - pad);
      const y = Math.max(0, box.y - pad);
      options.clip = {
        x,
        y,
        width: Math.min(bounds.width, box.x + box.width + pad) - x,
        height: Math.min(bounds.height, box.y + box.height + pad) - y,
      };
    }
    return PNG.sync.read(await page.screenshot(options));
  } finally {
    await page.close();
  }
}

// Compare a shot against its golden. Returns null on match; on mismatch,
// writes actual (and diff, when comparable) PNGs under outDir and returns
// a failure description.
export function compareToGolden(name, actual, goldenFile, outDir) {
  const writeActual = () => {
    mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${name}-actual.png`);
    writeFileSync(file, PNG.sync.write(actual));
    return file;
  };
  if (!existsSync(goldenFile)) {
    return `golden ${goldenFile} is missing (actual written to ${writeActual()}); to create it, run: npm run update:visual-goldens`;
  }
  const expected = PNG.sync.read(readFileSync(goldenFile));
  if (expected.width !== actual.width || expected.height !== actual.height) {
    return `size ${actual.width}x${actual.height} differs from golden ${expected.width}x${expected.height} (actual written to ${writeActual()})`;
  }
  const diff = new PNG({ width: actual.width, height: actual.height });
  const mismatched = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    actual.width,
    actual.height,
    // Bit-exact: same-platform rendering of the static fixture is
    // deterministic, and a nonzero threshold would swallow real per-pixel
    // color shifts (theme-token regressions drift well under pixelmatch's
    // default sensitivity). includeAA keeps antialiasing-classified pixels
    // in the count: the default AA detection would pass non-identical
    // images.
    { threshold: 0, includeAA: true },
  );
  if (mismatched === 0) return null;
  writeActual();
  const diffFile = path.join(outDir, `${name}-diff.png`);
  writeFileSync(diffFile, PNG.sync.write(diff));
  return `${mismatched} pixels differ from golden (diff written to ${diffFile})`;
}

// Mermaid's rendered SVG scopes its theme <style> under the SVG's per-render
// id; strip it, or any two renders differ.
export const mermaidSvgStyle = (page) =>
  page.$eval('.mermaid svg', (svg) =>
    (svg.querySelector('style')?.textContent ?? '').replaceAll(svg.id, ''),
  );

// Sets data-bs-theme=dark as soon as the document element exists: theme
// sniffs read it after their import settles, and a later toggle would reload.
export const darkFromStart = (page) =>
  page.evaluateOnNewDocument(() => {
    new MutationObserver((_, observer) => {
      if (!document.documentElement) return;
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      observer.disconnect();
    }).observe(document, { childList: true });
  });
