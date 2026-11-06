import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  readBlockConfig,
  toCamelCase,
  toClassName,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Applies section metadata tables that reach the browser unprocessed (local
 * `.plain.html` previews). The publishing pipeline normally converts them to
 * section classes server-side, in which case there is nothing to do.
 * @param {Element} main The container element
 */
function applySectionMetadata(main) {
  main.querySelectorAll(':scope > div > div.section-metadata').forEach((meta) => {
    const section = meta.parentElement;
    Object.entries(readBlockConfig(meta)).forEach(([key, value]) => {
      if (key === 'style') {
        value.split(',').map(toClassName).filter(Boolean).forEach((c) => section.classList.add(c));
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
    meta.remove();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  applySectionMetadata(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

const COMMERCE_BLOCKS = '.product-list-page, .product-details, .product-recommendations';

/**
 * Whether the page needs the commerce runtime (ACO catalog drop-ins).
 * Other pages never load it, so they work without a config.json.
 * @param {Element} main The main element
 * @returns {boolean}
 */
function isCommercePage(main) {
  return !!main && !!main.querySelector(COMMERCE_BLOCKS);
}

/**
 * Starts the commerce network work (config and module graph) in parallel.
 * Only runs on pages with a commerce block, so other pages never load it.
 */
function warmCommerce() {
  const hints = [
    ['preload', '/config.json', { as: 'fetch', crossOrigin: 'anonymous' }],
    ['modulepreload', `${window.hlx.codeBasePath}/scripts/commerce.js`],
    ['modulepreload', `${window.hlx.codeBasePath}/scripts/initializers/auth.js`],
    ['modulepreload', `${window.hlx.codeBasePath}/scripts/initializers/cart.js`],
    ['modulepreload', `${window.hlx.codeBasePath}/scripts/initializers/pdp.js`],
    ['modulepreload', `${window.hlx.codeBasePath}/scripts/initializers/wishlist.js`],
  ];
  hints.forEach(([rel, href, attrs]) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    Object.assign(link, attrs);
    document.head.append(link);
  });
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    if (isCommercePage(main)) {
      const commerce = import('./commerce.js');
      try {
        const { initializeCommerce, loadCommerceEager } = await commerce;
        await initializeCommerce();
        await (await import('./account.js')).applySessionPriceBook();
        decorateMain(main);
        await loadCommerceEager();
      } catch (e) {
        console.error('Error initializing commerce configuration:', e);
        (await commerce).loadErrorPage(418);
      }
    } else {
      decorateMain(main);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);
  if (isCommercePage(main)) await (await import('./commerce.js')).loadCommerceLazy();

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // installable app: register the service worker (never on local development servers)
  if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

if (isCommercePage(document.querySelector('main'))) warmCommerce();
loadPage();
