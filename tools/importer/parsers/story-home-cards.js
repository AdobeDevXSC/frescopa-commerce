/* eslint-disable */
/* global WebImporter */

/**
 * Live "home" cards -> Story (tasting) and Story (personal).
 * Each: row 1 image(s), row 2 h2 + paragraph + CTA. Tasting's CTA is the ember
 * (bold italic) pill. The live page repeats "Coffee Made Personal" four times;
 * it is used once. Photos are the live product images
 * (docs/migration/content-inventory.md, "Assets").
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const PRODUCTS = {
    bag: ['https://delivery-p149891-e1546482.adobeaemcloud.com/adobe/assets/urn:aaid:aem:5f861728-7e97-4513-ab01-d6d174f244d6', 'House Blend - Dark Roast'],
    pod: ['https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:0eff15fc-5599-4b47-8b52-cd1a788bc2da', 'Morning Muse - Light Roast'],
    mug: ['https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d99d2ffb-650f-48c3-803e-5af07960da05', 'Cappuccino Mug'],
  };
  const img = ([src, alt]) => {
    const i = document.createElement('img');
    i.src = src;
    i.alt = alt;
    return i;
  };
  const copy = (li, accent) => {
    const h2 = document.createElement('h2');
    h2.textContent = text(li.querySelector('h1, h2, h3, h4, h5, h6'));
    const p = document.createElement('p');
    p.textContent = text(li.querySelector('p:not(.button-container)'));
    const link = li.querySelector('a');
    const a = document.createElement('a');
    a.href = link ? link.getAttribute('href') : '';
    a.textContent = text(link);
    const strong = document.createElement('strong');
    if (accent) {
      const em = document.createElement('em');
      em.append(a);
      strong.append(em);
    } else {
      strong.append(a);
    }
    const ctaP = document.createElement('p');
    ctaP.append(strong);
    return [h2, p, ctaP];
  };
  const scene = (order, style, block) => {
    const wrap = document.createElement('div');
    wrap.dataset.d1Order = order;
    wrap.dataset.d1Style = style;
    wrap.append(block);
    return wrap;
  };

  const cards = [...element.querySelectorAll('li')];
  const find = (re) => cards.find((li) => re.test(text(li.querySelector('h1, h2, h3, h4, h5, h6'))));
  const out = [];

  const tasting = find(/^Elevate Your Coffee Game/);
  if (tasting) {
    out.push(scene('3', 'crema', WebImporter.DOMUtils.createTable([
      ['Story (tasting)'],
      [img(PRODUCTS.bag)],
      [copy(tasting, true)],
    ], document)));
  }
  const personal = find(/^Coffee Made Personal/);
  if (personal) {
    out.push(scene('4', 'coral', WebImporter.DOMUtils.createTable([
      ['Story (personal)'],
      [[img(PRODUCTS.pod), img(PRODUCTS.mug)]],
      [copy(personal, false)],
    ], document)));
  }
  element.replaceWith(...out);
}
