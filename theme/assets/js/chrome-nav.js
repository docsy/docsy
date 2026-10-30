// Client-side restore of the chrome a shared build drops: the docs left-nav,
// and the navbar and footer (see "Navbar and footer" below). Each dropped
// region leaves a placeholder naming its donor page (_partials/sidebar.html,
// navbar.html, footer.html); the donor's region is fetched, injected in place,
// and adapted to this page. The left-nav is cached in sessionStorage
// so later pages in the same section reuse it without re-fetching.
//
// The same active-state pass also hydrates the cached inline nav that the donor
// (and bigger sites) render once and share across pages: that menu ships hidden,
// with no per-page active state baked in. Either way the resulting DOM aims to
// match a full, non-shared render; the known gaps are the CCR case registry's
// open items (tests/fixture-site/README.md).

(function () {
  'use strict';

  const MENU_ID = 'td-sidebar-menu';
  const NAV_ID = 'td-section-nav';
  const CACHE_PREFIX = 'td-chrome-nav:';

  const normalizePath = (path) => (path.endsWith('/') ? path : path + '/');

  // The same-origin page path that `urlOrPath` denotes, with a trailing slash,
  // or null.
  function sameOriginPath(urlOrPath) {
    if (!urlOrPath) return null;
    const origin = window.location.origin;
    let path;
    try {
      const url = new URL(urlOrPath, window.location.href);
      if (url.origin !== origin) return null;
      // The path is written as a relative href, so it must read back as itself:
      // `/.//host/…` re-parses to another host; `//site//site//host/…` and
      // `blob:` (whose path is its inner URL) re-parse to a different path.
      path = url.pathname;
      const again = new URL(path, window.location.href);
      if (again.origin !== origin || again.pathname !== path) return null;
    } catch (e) {
      return null;
    }
    return normalizePath(path);
  }

  // The page's HTML URL, the one its nav links use, keys all active-state
  // restores, and the selector-link restores rebuild hrefs from it. Every
  // navbar placeholder carries it as data-canonical-path (see navbar.html),
  // since on print (/_print/…) and paginator (…/page/N/) pages the request URL
  // isn't that URL; init() reads it once, before the placeholders are swapped
  // out. Pages without a valid hint (no placeholder, as on full-mode pages with
  // the cached sidebar; an override that drops it) key on window.location.
  let canonicalPath = null;

  function currentPath() {
    return canonicalPath || sameOriginPath(window.location.pathname) || '/';
  }

  function readCanonicalPath() {
    const el = document.querySelector('[data-canonical-path]');
    return sameOriginPath(el && el.getAttribute('data-canonical-path'));
  }

  // Apply the active-page classes to a freshly injected or shared nav. The
  // current page is matched by link href rather than a server-baked id, so one
  // shared fragment can serve every page under the same sidebar root.
  function applyActiveState(menu) {
    const nav = menu.querySelector('#' + NAV_ID);
    if (!nav) return;

    const here = currentPath();

    // Prefer an exact nav entry for this page; otherwise fall back to the
    // nearest ancestor entry (longest matching prefix). An out-of-tree page (one
    // absent from its own nav, e.g. via toc_hide) has no exact entry, but a
    // full build still marks its ancestor sections as the active path (sidebar
    // tree: active-path when the page IsDescendant of a section), so anchor on
    // the ancestor to reproduce that trail.
    let activeLink = null;
    let ancestorLink = null;
    let ancestorLen = -1;
    for (const link of nav.querySelectorAll('a[href]')) {
      let path;
      try {
        path = normalizePath(new URL(link.href).pathname);
      } catch (e) {
        continue;
      }
      if (path === here) {
        activeLink = link;
        break;
      }
      if (here.startsWith(path) && path.length > ancestorLen) {
        ancestorLink = link;
        ancestorLen = path.length;
      }
    }

    const anchorLink = activeLink || ancestorLink;
    if (!anchorLink) return;

    // Only an exact match is the "active" link; an ancestor anchor gets the
    // active-path trail but no active link/item, matching a full build.
    if (activeLink) {
      activeLink.classList.add('active');
      const label = activeLink.querySelector('span');
      if (label) label.classList.add('td-sidebar-nav-active-item');
    }

    const currentItem = anchorLink.closest('li');

    for (
      let li = currentItem;
      li;
      li = li.parentElement && li.parentElement.closest('li')
    ) {
      li.classList.add('active-path');
    }

    // Reveal the active path. A foldable nav (the Docsy default for docs sites)
    // opens purely via checked checkboxes (exactly what a full build bakes), so
    // we set the same attribute and add nothing else, keeping the result
    // structurally identical to a full render. A non-foldable nav has no
    // checkboxes and instead uses the Bootstrap `show` class to open branches.
    const foldable = !!nav.querySelector('input[type="checkbox"]');
    for (const li of nav.querySelectorAll('li.active-path')) {
      const checkbox = li.querySelector(':scope > input[type="checkbox"]');
      if (checkbox) checkbox.setAttribute('checked', '');
      else if (!foldable) li.classList.add('show');
    }

    // In a non-foldable nav, also open the current item's siblings and direct
    // children (not every ancestor's siblings, as a full build does; CCR-07); a
    // foldable nav leaves these to the checkboxes, matching a full build (which
    // only checks the active path). Exact-match pages only: an ancestor anchor
    // isn't the current item, so it gets no extra expansion.
    if (activeLink && currentItem && !foldable) {
      for (const sibling of currentItem.parentElement.children) {
        if (sibling !== currentItem && sibling.tagName === 'LI') {
          sibling.classList.add('show');
        }
      }
      const childList = currentItem.querySelector(':scope > ul');
      if (childList) {
        for (const child of childList.children) {
          if (child.tagName === 'LI') child.classList.add('show');
        }
      }
    }
  }

  function hydrate(menu) {
    applyActiveState(menu);
    menu.classList.remove('d-none');
  }

  function readCache(key) {
    try {
      return window.sessionStorage.getItem(CACHE_PREFIX + key);
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, value) {
    try {
      window.sessionStorage.setItem(CACHE_PREFIX + key, value);
    } catch (e) {
      // sessionStorage may be unavailable or full; injection still works.
    }
  }

  // --- Sidebar-root scoping (sidebar_root_for) ----------------------------
  // Self-contained so it's easy to review or remove. The donor ships the full
  // docs-landing tree; on a scoped page we prune it to the subtree rooted at
  // `navRoot` and re-point that root item "up" to its parent, matching a full
  // build's scoped sidebar. Functional parity only (same links, same active
  // item); wrappers and depth numbering may differ.
  function reRootMenu(menu, navRoot) {
    const nav = menu.querySelector('#' + NAV_ID);
    if (!nav) return;
    const rootUrl = new URL(navRoot, window.location.href);
    const rootPath = normalizePath(rootUrl.pathname);

    let rootLink = null;
    for (const link of nav.querySelectorAll('a[href]')) {
      if (normalizePath(new URL(link.href).pathname) === rootPath) {
        rootLink = link;
        break;
      }
    }
    const rootLi = rootLink && rootLink.closest('li');
    if (!rootLi) return; // hint didn't resolve; leave the full tree in place

    // Re-point the scope-root item up to its parent (the "up" affordance).
    rootLink.setAttribute('href', new URL('..', rootUrl).pathname);
    rootLink.classList.add('tree-root');

    // Match a full scoped build's root markers when sidebar-root scoping is on
    // (the donor nav carries data-sidebar-root-id iff sidebar_root_enabled):
    // advertise the subtree as the nav's root, and flag the root link's label as
    // the "up" icon (see sidebar-tree.html for data-sidebar-root-id and the
    // up-icon span).
    if (nav.hasAttribute('data-sidebar-root-id')) {
      nav.setAttribute('data-sidebar-root-id', rootPath);
      const rootSpan = rootLink.querySelector('span');
      if (rootSpan) rootSpan.classList.add('td-sidebar-root-up-icon');
    }

    const topUl = nav.querySelector('ul');
    if (topUl) {
      rootLi.remove();
      topUl.replaceChildren(rootLi);
    }
  }

  // Parse the stored/extracted menu markup into this document and swap it in for
  // the placeholder, then hydrate it.
  function injectMarkup(placeholder, menuMarkup) {
    const template = document.createElement('template');
    template.innerHTML = menuMarkup.trim();
    const menu = template.content.firstElementChild;
    if (!menu) return;
    const navRoot = placeholder.getAttribute('data-nav-root');
    placeholder.replaceWith(menu);
    // Re-root once in-document, so link hrefs resolve to absolute URLs.
    if (navRoot) reRootMenu(menu, navRoot);
    hydrate(menu);
  }

  function injectFromDonor(placeholder) {
    const donor = placeholder.getAttribute('data-nav-donor');
    if (!donor) return;

    const cached = readCache(donor);
    if (cached) {
      injectMarkup(placeholder, cached);
      return;
    }

    fetch(donor)
      .then((response) =>
        response.ok ? response.text() : Promise.reject(response.status),
      )
      .then((html) => {
        // The donor is a full page; pull just the left-nav menu out of it.
        const donorDoc = new DOMParser().parseFromString(html, 'text/html');
        const menu = donorDoc.getElementById(MENU_ID);
        if (!menu) return;
        const markup = menu.outerHTML;
        writeCache(donor, markup);
        injectMarkup(placeholder, markup);
      })
      .catch((reason) => {
        // Leave the placeholder in place (recovery: tests/fixture-site/README.md
        // § Open items).
        console.warn('chrome-nav: could not fetch nav donor', donor, reason);
      });
  }

  // --- Navbar and footer ---------------------------------------------------
  const CHROME_REGIONS = { navbar: '.td-navbar', footer: '.td-footer' };

  // Re-apply this page's navbar cover/theme traits after the swap. The cover
  // (translucent) styling and dark theme are per-page, but the restored navbar
  // is the donor page's, which may carry different traits. The placeholder's
  // server-baked hints (data-navbar-cover, data-navbar-theme) carry this page's,
  // so the result matches a full build (see _partials/navbar.html).
  function applyNavbarCoverTheme(navbar, placeholder) {
    const cover = placeholder.getAttribute('data-navbar-cover') === 'true';
    navbar.classList.toggle('td-navbar-cover', cover);
    navbar.classList.toggle('td-navbar-transparent', cover);
    const theme = placeholder.getAttribute('data-navbar-theme');
    if (theme) {
      navbar.setAttribute('data-bs-theme', theme);
    } else {
      navbar.removeAttribute('data-bs-theme');
    }
  }

  // Re-derive the navbar's active link for the current page. The donor page's
  // navbar carries its own active state, so clear it and mark the nav-link
  // whose target is the closest ancestor of the current path (longest prefix),
  // an approximation of a full build's per-entry menu-membership tests
  // (CCR-03, CCR-20).
  function setNavbarActive(navbar) {
    const here = currentPath();
    let best = null;
    let bestLen = -1;
    for (const link of navbar.querySelectorAll('.navbar-nav .nav-link')) {
      link.classList.remove('active');
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#')) continue; // skip dropdown toggles
      let path;
      try {
        path = normalizePath(new URL(link.href).pathname);
      } catch (e) {
        continue;
      }
      if ((here === path || here.startsWith(path)) && path.length > bestLen) {
        best = link;
        bestLen = path.length;
      }
    }
    if (best) best.classList.add('active');
  }

  // The navbar's version/language selectors carry per-page links that the donor
  // page renders for itself, so re-derive each for the current page; `donorPath`
  // is the donor page's path, the current language's root. Version links are
  // exact when the donor path is a directory (not under uglyURLs, CCR-09):
  // each is a version's base URL plus the page path
  // (when `version_menu_pagelinks` is on), so the donor's link is
  // `base + donorPath`. Strip that path and append this page's to reproduce the
  // full build's `base + thisPagePath`. Links without the page path (pagelinks
  // off) don't end with `donorPath`, so they're left untouched.
  function restoreVersionLinks(navbar, donorPath) {
    const here = currentPath();
    for (const link of navbar.querySelectorAll(
      '.td-version-menu .dropdown-menu a[href]',
    )) {
      const href = link.getAttribute('href');
      if (!href.endsWith(donorPath)) continue;
      const base = href.slice(0, href.length - donorPath.length);
      link.setAttribute('href', base + here);
    }
  }

  // Language links point at the current page's counterpart in each language;
  // the donor page renders its own, i.e. each language's root. Swap the current
  // language's root prefix (`donorPath`) for the target language's to reproduce
  // the full build's link; a best-effort restore when slugs differ across
  // languages (CCR-10) or the donor path is a file (uglyURLs; CCR-09/10).
  function restoreLangLinks(navbar, donorPath) {
    const here = currentPath();
    if (!here.startsWith(donorPath)) return;
    const rel = here.slice(donorPath.length);
    for (const link of navbar.querySelectorAll(
      '.td-lang-menu .dropdown-menu a[href]',
    )) {
      const langHome = normalizePath(new URL(link.href).pathname);
      // A `//` right after the prefix would read as a host.
      const target = sameOriginPath(langHome + rel);
      if (target) link.setAttribute('href', target);
    }
  }

  function restoreSelectorLinks(navbar, donorPath) {
    restoreVersionLinks(navbar, donorPath);
    restoreLangLinks(navbar, donorPath);
  }

  // Fetch a donor page (cached across the session) and hand its parsed Document
  // to `callback`. Used to restore the navbar and footer from the root page.
  function withDonorDoc(url, callback) {
    const cached = readCache('doc:' + url);
    if (cached) {
      callback(new DOMParser().parseFromString(cached, 'text/html'));
      return;
    }
    fetch(url)
      .then((response) =>
        response.ok ? response.text() : Promise.reject(response.status),
      )
      .then((html) => {
        writeCache('doc:' + url, html);
        callback(new DOMParser().parseFromString(html, 'text/html'));
      })
      .catch((reason) => {
        // Leave the placeholder in place (recovery: tests/fixture-site/README.md
        // § Open items).
        console.warn('chrome-nav: could not fetch chrome donor', url, reason);
      });
  }

  function restoreChrome() {
    const placeholders = document.querySelectorAll(
      '.td-chrome-placeholder[data-chrome-donor]',
    );
    if (!placeholders.length) return;
    const donor = placeholders[0].getAttribute('data-chrome-donor');
    const donorPath = normalizePath(
      new URL(donor, window.location.href).pathname,
    );
    withDonorDoc(donor, (donorDoc) => {
      for (const placeholder of placeholders) {
        const region = placeholder.getAttribute('data-chrome-region');
        const selector = CHROME_REGIONS[region];
        const source = selector && donorDoc.querySelector(selector);
        if (!source) continue;
        const node = document.importNode(source, true);
        placeholder.replaceWith(node);
        if (region === 'navbar') {
          applyNavbarCoverTheme(node, placeholder);
          setNavbarActive(node);
          restoreSelectorLinks(node, donorPath);
        }
      }
    });
  }

  function init() {
    canonicalPath = readCanonicalPath();
    restoreChrome();
    const placeholder = document.querySelector(
      '.td-sidebar-chrome-placeholder[data-nav-donor]',
    );
    if (placeholder) {
      injectFromDonor(placeholder);
      return;
    }
    const menu = document.getElementById(MENU_ID);
    if (menu && menu.classList.contains('d-none')) {
      hydrate(menu);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
