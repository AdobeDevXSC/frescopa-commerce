/* eslint-disable */
/* global WebImporter */

/**
 * Live `teaser` (hero) -> Hero (arch): row 1 image, row 2 h1 + label + CTA.
 * Approved corrections 1 and 2: h1 grammar, label without its trailing "...".
 * Output is wrapped with data-d1-order/data-d1-style for the section transformer.
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const abs = (u) => new URL(u, document.location ? document.location.href : 'https://frescopa.coffee/').href.split('?')[0];

  const picture = element.querySelector('picture img, img');
  // the live teaser alt describes a different photo; the same photo carries an
  // accurate alt in the live image stack below the rewards banner
  const stackAlt = [...document.querySelectorAll('main img')]
    .map((i) => i.alt)
    .find((alt) => /^Friends Enjoying Coffee/.test(alt));
  const image = document.createElement('img');
  image.src = picture ? abs(picture.getAttribute('src')) : '';
  image.alt = stackAlt || (picture ? picture.alt : '');

  const title = text(element.querySelector('.title h1, .title h2, .title h3, h1, h2, h3'))
    .replace(/ in four questions away!$/, ' is four questions away.');
  const h1 = document.createElement('h1');
  const phrase = 'four questions';
  const at = title.indexOf(phrase);
  if (at >= 0) {
    const em = document.createElement('em');
    em.textContent = phrase;
    h1.append(title.slice(0, at), em, title.slice(at + phrase.length));
  } else {
    h1.textContent = title;
  }

  // the live teaser script uppercases the eyebrow; keep the authored casing
  const eyebrow = text(element.querySelector('.eyebrow')).replace(/(\.\.\.|…)$/, '');
  const label = document.createElement('p');
  label.textContent = /^mybarista coffee quiz$/i.test(eyebrow) ? 'MyBarista Coffee Quiz' : eyebrow;

  const link = element.querySelector('.cta a, a');
  const ctaP = document.createElement('p');
  const strong = document.createElement('strong');
  const a = document.createElement('a');
  a.href = link ? link.getAttribute('href') : '';
  a.textContent = text(link);
  strong.append(a);
  ctaP.append(strong);

  const block = WebImporter.DOMUtils.createTable([
    ['Hero (arch)'],
    [image],
    [[h1, label, ctaP]],
  ], document);

  const wrap = document.createElement('div');
  wrap.dataset.d1Order = '1';
  wrap.dataset.d1Style = 'roast';
  wrap.append(block);
  element.replaceWith(wrap);
}
