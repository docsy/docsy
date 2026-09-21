// Mermaid plugin entry: imports the pinned library named in the companion's
// config block and renders the page's `.mermaid` blocks. Design:
// https://www.docsy.dev/project/design/script-loading/#ordering-decisions
(async function () {
  'use strict';

  if (!document.querySelector('.mermaid')) return;

  const block = document.querySelector(
    'script[type="application/json"][data-docsy-plugin="mermaid"]',
  );
  if (!block) return;

  // Mermaid has no reinitialization (mermaid-js/mermaid#1945): a change of
  // rendered theme reloads the page. Installed before any await so a toggle
  // during a pending import or render is not missed.
  const isDark = () => document.documentElement.dataset.bsTheme === 'dark';
  const renderedDark = isDark();
  new MutationObserver(() => {
    if (isDark() !== renderedDark) location.reload();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });

  try {
    const config = JSON.parse(block.textContent);
    const { default: mermaid } = await import(config.url);

    const settings = { ...(config.options ?? {}), startOnLoad: false };
    if (renderedDark) settings.theme = 'dark';
    mermaid.initialize(settings);

    // Wait for `load`: fonts loaded through CSS are in by then, so label
    // geometry matches the pre-plugin, load-bound auto-start.
    if (document.readyState !== 'complete') {
      await new Promise((resolve) =>
        window.addEventListener('load', resolve, { once: true }),
      );
    }
    await mermaid.run();
  } catch (err) {
    console.error('Mermaid failed to render', err);
  }
})();
