/* eslint-disable */
/* global WebImporter */

/**
 * Live runtime product grid (`product-list-page-custom`) -> Cards (arch) (D11).
 * One row per product: its live photo | h3 with the product name linking to
 * the live product page. No prices. The grid's heading (an h3 just before it
 * on the live page) becomes the section's h2.
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const base = document.location ? document.location.href : 'https://frescopa.coffee/';

  const seen = new Set();
  const rows = [];
  element.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a[href*="/products/"]');
    if (!link) return;
    const href = new URL(link.getAttribute('href'), 'https://frescopa.coffee/').href;
    if (seen.has(href)) return;
    seen.add(href);
    const photo = li.querySelector('img');
    const name = text(li.querySelector('.name')) || (photo ? photo.alt : '');
    const img = document.createElement('img');
    img.src = photo ? new URL(photo.getAttribute('src'), base).href : '';
    img.alt = name;
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = name;
    h3.append(a);
    rows.push([img, h3]);
  });

  const wrap = document.createElement('div');
  wrap.dataset.d1Style = 'roast';
  // heading right before the grid on the live page
  const wrapper = element.parentElement;
  const prev = wrapper && wrapper.previousElementSibling;
  const heading = prev && prev.classList.contains('default-content-wrapper')
    ? prev.querySelector(':scope > :is(h2, h3, h4):last-child') : null;
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = text(heading);
    wrap.append(h2);
    heading.remove();
  }
  wrap.append(WebImporter.DOMUtils.createTable([['Cards (arch)'], ...rows], document));
  element.replaceWith(wrap);
}
