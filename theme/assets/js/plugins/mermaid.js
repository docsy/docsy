// Deferred (shim-pinned): the companion's config block and the render hook's
// <pre class="mermaid"> markup are parsed before this runs. Start is explicit:
// a dynamic import can settle after `load`, past Mermaid's load-bound
// auto-start (startOnLoad).
(async function () {
  'use strict';

  if (!document.querySelector('.mermaid')) return;

  // Typed selector: a heading titled "Docsy Mermaid" also gets this id.
  const block = document.querySelector(
    'script#docsy-mermaid[type="application/json"]',
  );
  if (!block) return;

  // Mermaid has no reinitialization (mermaid-js/mermaid#1945): a theme change
  // reloads the page. Installed before any await so a toggle during a pending
  // import or render is not missed.
  new MutationObserver((mutations) => {
    const html = document.documentElement;
    if (mutations.some((m) => m.oldValue !== html.getAttribute('data-bs-theme'))) {
      location.reload();
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
    attributeOldValue: true,
  });

  try {
    const config = JSON.parse(block.textContent);
    const { default: mermaid } = await import(config.url);

    const settings = { ...(config.options ?? {}), startOnLoad: false };
    if (document.documentElement.dataset.bsTheme === 'dark') {
      settings.theme = 'dark';
    }
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
