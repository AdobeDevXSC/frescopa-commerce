/* eslint-disable */
/* global WebImporter */

/**
 * Link policy for every migrated page (docs/migration/page-inventory.md):
 * - pages in the migrate list stay site-relative (`/coffee`; `/en/tea` -> `/tea`)
 * - every other frescopa.coffee link goes to the live site, absolute
 *   (quiz, products, account, signup, blog ...)
 * - a link with no target whose text is an email address becomes mailto:
 * - links a parser marks `data-d1-live` deliberately point to the live site
 *   (store search, the live enquiry form) and are left as they are
 */
const MIGRATED = ['/', '/coffee', '/machines', '/accessories', '/tea', '/about-us',
  '/sustainability', '/business', '/locations', '/subscription', '/contact-us'];
const ALIASES = { '/en/tea': '/tea', '/business.html': '/business', '/index': '/' };

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform' || !payload) return;
  element.querySelectorAll('a').forEach((a) => {
    if (a.hasAttribute('data-d1-live')) {
      a.removeAttribute('data-d1-live');
      return;
    }
    const raw = (a.getAttribute('href') || '').trim();
    const label = a.textContent.trim();
    if (!raw) {
      if (/^[^\s@]+@[^\s@]+\.[a-z]+$/i.test(label)) a.setAttribute('href', `mailto:${label}`);
      return;
    }
    if (/^(mailto|tel):/i.test(raw) || raw.startsWith('#')) return;
    let url;
    try { url = new URL(raw, 'https://frescopa.coffee/'); } catch (e) { return; }
    if (url.hostname !== 'frescopa.coffee') return;
    let path = url.pathname.replace(/\/$/, '') || '/';
    path = ALIASES[path] || path;
    if (MIGRATED.includes(path)) {
      a.setAttribute('href', `${path}${url.search}${url.hash}`);
    } else {
      a.setAttribute('href', `https://frescopa.coffee${path}${url.search}${url.hash}`);
    }
  });
}
