/* eslint-disable */
/* global WebImporter */

/**
 * Live `store-locator` -> Store Locator: one row, two cells.
 * Cell 1: h2, field label, field placeholder, link (text = button, URL = search page).
 * Cell 2: the address card, taken from the live footer brand block.
 * Approved correction 4: "Post Code" -> "ZIP code". No map. The search goes to
 * the live locations page (homepage-spec.md §8; its query parameter is an open question).
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const para = (t) => {
    const p = document.createElement('p');
    p.textContent = t;
    return p;
  };

  const h2 = document.createElement('h2');
  h2.textContent = text(element.querySelector('.sidepanel__title, h1, h2, h3'));
  const input = element.querySelector('input');
  const placeholder = (input ? input.getAttribute('placeholder') || '' : '').replace(/^Post Code$/i, 'ZIP code');
  const button = element.querySelector('.search__button, button');
  const search = document.createElement('a');
  search.href = 'https://frescopa.coffee/locations';
  search.textContent = text(button) || 'Search';
  const searchP = document.createElement('p');
  searchP.append(search);
  const form = [h2, para(text(element.querySelector('.search__title'))), para(placeholder), searchP];

  // address card: the live footer brand block (name, tagline, address/email/phone)
  const card = [];
  const brand = document.querySelector('footer h1, footer h2, footer h3, footer h4, footer h5, footer h6');
  if (brand) {
    const h3 = document.createElement('h3');
    h3.textContent = text(brand);
    card.push(h3);
    let next = brand.nextElementSibling;
    while (next && next.tagName === 'P') {
      // one line per text run or link, separated by single line breaks
      const lines = [];
      [...next.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          if (n.textContent.trim()) lines.push(n.textContent.trim());
        } else if (n.tagName === 'A') {
          const a = document.createElement('a');
          a.href = n.getAttribute('href');
          a.textContent = text(n);
          lines.push(a);
        } else if (n.tagName !== 'BR' && text(n)) {
          lines.push(text(n));
        }
      });
      const p = document.createElement('p');
      lines.forEach((line, i) => {
        if (i) p.append(document.createElement('br'));
        p.append(line);
      });
      card.push(p);
      next = next.nextElementSibling;
    }
  }

  const wrap = document.createElement('div');
  wrap.dataset.d1Order = '6';
  wrap.dataset.d1Style = 'amber';
  wrap.append(WebImporter.DOMUtils.createTable([['Store Locator'], [form, card]], document));
  element.replaceWith(wrap);
}
