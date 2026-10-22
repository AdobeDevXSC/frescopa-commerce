/* eslint-disable */
/* global WebImporter */

/**
 * Image-and-text features -> Columns: one row per feature, image | text.
 * - Live `cards` (sustainability focus areas, subscription steps): each card's
 *   image and its body (h3, bold lead-ins, paragraphs) as written. A heading
 *   right before the cards on the live page becomes the section's h2.
 * - Live dark `teaser` (contact "FIND YOUR ANSWERS"): image | h2, paragraph,
 *   CTA as a bold link (D14: keeps its live target).
 * Image alt text is the live alt (empty where the live image has none).
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const base = document.location ? document.location.href : 'https://frescopa.coffee/';
  const image = (src) => {
    if (!src || !src.getAttribute('src')) return '';
    const img = document.createElement('img');
    img.src = new URL(src.getAttribute('src'), base).href.split('?')[0];
    img.alt = src.getAttribute('alt') || '';
    return img;
  };
  const copy = (nodes) => nodes.filter((n) => text(n)).map((n) => {
    const el = document.createElement(n.tagName.toLowerCase());
    el.innerHTML = n.innerHTML;
    return el;
  });

  const rows = [];
  const wrap = document.createElement('div');

  if (element.classList.contains('teaser')) {
    wrap.dataset.d1Style = 'amber';
    const body = copy([...element.querySelectorAll('.title :is(h1, h2, h3), .long-description p')]);
    const link = element.querySelector('.cta a');
    if (link && text(link)) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href') || '/';
      a.textContent = text(link);
      const strong = document.createElement('strong');
      strong.append(a);
      const p = document.createElement('p');
      p.append(strong);
      body.push(p);
    }
    rows.push([image(element.querySelector('.background img, img')), body]);
  } else {
    wrap.dataset.d1Style = 'crema';
    element.querySelectorAll('li').forEach((li) => {
      const bodyCell = li.querySelector('.cards-card-body') || li;
      rows.push([image(li.querySelector('.cards-card-image img, img')), copy([...bodyCell.children])]);
    });
    const wrapper = element.parentElement;
    const prev = wrapper && wrapper.previousElementSibling;
    const heading = prev && prev.classList.contains('default-content-wrapper')
      ? prev.querySelector(':scope > :is(h2, h3):last-child') : null;
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = text(heading);
      wrap.append(h2);
      heading.remove();
    }
  }

  wrap.append(WebImporter.DOMUtils.createTable([['Columns'], ...rows], document));
  element.replaceWith(wrap);
}
