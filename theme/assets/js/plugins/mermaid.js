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
  new MutationObserver(() => location.reload()).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-bs-theme'] },
  );

  try {
    const config = JSON.parse(block.textContent);
    const { default: mermaid } = await import(config.url);

    // `options` is the site's mermaid.initialize() object, casing intact;
    // Docsy owns the start and, in dark mode, the theme.
    const settings = { ...(config.options ?? {}), startOnLoad: false };
    if (document.documentElement.dataset.bsTheme === 'dark') {
      settings.theme = 'dark';
    }
    mermaid.initialize(settings);

    // No earlier than today's load-bound auto-start: fonts loaded through CSS
    // are in by then, so label geometry matches.
    if (document.readyState !== 'complete') {
      await new Promise((resolve) =>
        window.addEventListener('load', resolve, { once: true }),
      );
    }
    // Mermaid 10+ API; older pins render nothing.
    await mermaid.run();
  } catch (err) {
    console.error('Mermaid failed to render', err);
  }
})();
