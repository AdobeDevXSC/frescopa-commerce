/* eslint-disable */
/* global WebImporter */

/**
 * A page that opens with a plain heading (About Us, Locations) -> text-only
 * Hero (arch): the heading becomes the page's h1, with the paragraph right
 * after it (if any) as the hero body. The rest of the prose stays where it is;
 * its h3 sub-headings move up to h2 under the new h1.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector(':scope > :is(h1, h2, h3, h4)');
  if (!heading) return;

  const content = [];
  const h1 = document.createElement('h1');
  h1.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
  content.push(h1);
  const next = heading.nextElementSibling;
  if (next && next.tagName === 'P' && next.textContent.trim()) {
    const p = document.createElement('p');
    p.innerHTML = next.innerHTML;
    content.push(p);
    next.remove();
  }

  // keep the outline: sub-headings directly under the new h1
  if (!element.querySelector(':scope > h2:not(:first-child)')) {
    element.querySelectorAll(':scope > h3').forEach((h3) => {
      if (h3 === heading) return;
      const h2 = document.createElement('h2');
      h2.innerHTML = h3.innerHTML;
      h3.replaceWith(h2);
    });
  }

  const wrap = document.createElement('div');
  wrap.dataset.d1Style = 'roast';
  wrap.append(WebImporter.DOMUtils.createTable([['Hero (arch)'], [content]], document));
  heading.replaceWith(wrap);
}
