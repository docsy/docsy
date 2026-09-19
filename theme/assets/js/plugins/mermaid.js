// Deferred (shim-pinned): the companion's config block and the render hook's
// <pre class="mermaid"> markup are parsed before this runs. Start is explicit:
// a dynamic import can settle after `load`, past Mermaid's load-bound
// auto-start (startOnLoad).
(async function () {
  'use strict';

  if (!document.querySelector('.mermaid')) return;

  const config = JSON.parse(
    document.getElementById('docsy-mermaid')?.textContent ?? '{}',
  );
  const params = config.params ?? {};

  // Mermaid has no reinitialization (mermaid-js/mermaid#1945): a theme change
  // reloads the page. Installed before any await so a toggle during a pending
  // import or render is not missed.
  new MutationObserver(() => location.reload()).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-bs-theme'] },
  );

  const { default: mermaid } = await import(config.url);

  // Site params are stored with lowercase keys; recover the casing from
  // Mermaid's default config.
  const norm = (defaultConfig, params) => {
    const result = {};
    for (const key in defaultConfig) {
      const keyLower = key.toLowerCase();
      if (
        Object.hasOwn(defaultConfig, key) &&
        Object.hasOwn(params, keyLower)
      ) {
        result[key] =
          typeof defaultConfig[key] === 'object'
            ? norm(defaultConfig[key], params[keyLower])
            : params[keyLower];
      }
    }
    return result;
  };

  const settings = norm(mermaid.mermaidAPI.defaultConfig, params);
  if (document.documentElement.dataset.bsTheme === 'dark') {
    settings.theme = 'dark';
  }
  settings.startOnLoad = false;
  mermaid.initialize(settings);

  // No earlier than today's load-bound auto-start: fonts loaded through CSS
  // are in by then, so label geometry matches.
  if (document.readyState !== 'complete') {
    await new Promise((resolve) =>
      window.addEventListener('load', resolve, { once: true }),
    );
  }
  try {
    await mermaid.run();
  } catch (err) {
    console.error('Mermaid failed to render', err);
  }
})();
