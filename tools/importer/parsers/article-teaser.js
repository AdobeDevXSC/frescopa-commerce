/* eslint-disable */
/* global WebImporter */

/**
 * Live `article` (rendered from its content fragment) -> default content:
 * h2 with the article title and its summary paragraph (Phase 0 decision D6).
 * There is no article page to link to on the live site.
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const wrap = document.createElement('div');
  wrap.dataset.d1Style = 'crema';
  const title = text(element.querySelector('.headline, h1, h2, h3, h4'));
  const summary = text(element.querySelector('.detail, p'));
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    wrap.append(h2);
  }
  if (summary) {
    const p = document.createElement('p');
    p.textContent = summary;
    wrap.append(p);
  }
  element.replaceWith(wrap);
}
