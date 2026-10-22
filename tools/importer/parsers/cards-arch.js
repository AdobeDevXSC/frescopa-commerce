/* eslint-disable */
/* global WebImporter */

/**
 * Live "card-tiles" cards -> Cards (arch), preceded by the section heading.
 * One row per card: image | h3 with the link. Approved correction 3:
 * "Bundles!!!" -> "Bundles". Links per homepage-spec.md §7. Product photos are
 * the live product images; Bundles has no photo, so it keeps its live line icon.
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const abs = (u) => new URL(u, document.location ? document.location.href : 'https://frescopa.coffee/').href.split('?')[0];
  const TILES = {
    'Coffee Machines': ['/machines', 'https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:8e7990e0-4758-4fe1-9357-9e6d7f555160', 'Fresco Original'],
    'Bagged Coffee': ['/coffee', 'https://delivery-p149891-e1546482.adobeaemcloud.com/adobe/assets/urn:aaid:aem:5f861728-7e97-4513-ab01-d6d174f244d6', 'House Blend - Dark Roast'],
    'Coffee Pods': ['/coffee', 'https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:0eff15fc-5599-4b47-8b52-cd1a788bc2da', 'Morning Muse - Light Roast'],
    Bundles: ['/tea'],
    Accessories: ['/accessories', 'https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d99d2ffb-650f-48c3-803e-5af07960da05', 'Cappuccino Mug'],
  };

  const rows = [...element.querySelectorAll('li')].map((li) => {
    const label = text(li.querySelector('h1, h2, h3, h4, h5, h6')).replace(/!+$/, '');
    const [href = '', photo, alt = ''] = TILES[label] || [];
    const image = document.createElement('img');
    const icon = li.querySelector('img');
    image.src = photo || (icon ? abs(icon.getAttribute('src')) : '');
    image.alt = photo ? alt : '';
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    h3.append(a);
    return [image, h3];
  });

  const wrap = document.createElement('div');
  wrap.dataset.d1Order = '5';
  wrap.dataset.d1Style = 'roast';
  const section = element.closest('.section');
  const heading = section ? section.querySelector('h1, h2') : null;
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = text(heading);
    wrap.append(h2);
    heading.remove();
  }
  wrap.append(WebImporter.DOMUtils.createTable([['Cards (arch)'], ...rows], document));
  element.replaceWith(wrap);
}
