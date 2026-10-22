/* eslint-disable */
/* global WebImporter */

/**
 * Live `reward` -> Reward: one row with h2, one paragraph and the CTA.
 * Approved correction 6: body trimmed to its first sentence.
 * "Claim Rewards" keeps the live URL (Phase 0 decision D3).
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const abs = (u) => new URL(u, document.location ? document.location.href : 'https://frescopa.coffee/').href;

  const heading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => text(h));
  const h2 = document.createElement('h2');
  h2.textContent = text(heading);

  const body = [...element.querySelectorAll('p')].map(text).find((t) => t) || '';
  const p = document.createElement('p');
  p.textContent = (body.match(/^.*?[.!?](?=\s|$)/) || [body])[0];

  const link = element.querySelector('a');
  const a = document.createElement('a');
  a.href = link ? abs(link.getAttribute('href')) : '';
  a.textContent = text(link);
  const strong = document.createElement('strong');
  strong.append(a);
  const ctaP = document.createElement('p');
  ctaP.append(strong);

  const wrap = document.createElement('div');
  wrap.dataset.d1Order = '7';
  wrap.dataset.d1Style = 'roast';
  wrap.append(WebImporter.DOMUtils.createTable([['Reward'], [[h2, p, ctaP]]], document));
  element.replaceWith(wrap);
}
