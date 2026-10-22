/* eslint-disable */
/* global WebImporter */

/**
 * Live `offer` (rendered from its content fragment) -> Story (dawn):
 * row 1 the sunrise photo (used by the live "Elevate" card, at its original size),
 * row 2 h2 + paragraph + CTA.
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const abs = (u) => new URL(u, document.location ? document.location.href : 'https://frescopa.coffee/').href.split('?')[0];

  const sunrise = document.querySelector('main img[src*="Frescopa-coffee-landscape-113"]');
  const image = document.createElement('img');
  image.src = sunrise ? abs(sunrise.getAttribute('src')) : '';
  // live alt text written for this photo (misplaced in the live image stack)
  image.alt = [...document.querySelectorAll('main img')]
    .map((i) => i.alt)
    .find((a) => /^Sunrise Coffee Moment/.test(a)) || '';

  const h2 = document.createElement('h2');
  h2.textContent = text(element.querySelector('.headline, h1, h2, h3, h4'));
  const p = document.createElement('p');
  p.textContent = text(element.querySelector('.detail, p'));

  const link = element.querySelector('a');
  const ctaP = document.createElement('p');
  const strong = document.createElement('strong');
  const a = document.createElement('a');
  a.href = link ? link.getAttribute('href') : '';
  a.textContent = text(link);
  strong.append(a);
  ctaP.append(strong);

  const block = WebImporter.DOMUtils.createTable([
    ['Story (dawn)'],
    [image],
    [[h2, p, ctaP]],
  ], document);

  const wrap = document.createElement('div');
  wrap.dataset.d1Order = '2';
  wrap.dataset.d1Style = 'amber';
  wrap.append(block);
  element.replaceWith(wrap);
}
