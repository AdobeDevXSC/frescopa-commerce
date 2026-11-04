/* eslint-disable */
/* global WebImporter */

/**
 * Live `teaser` (page banner) -> Hero (arch).
 * Row 1: the teaser image (omitted when there is none: text-only hero).
 * Row 2: bold label (the eyebrow), h1 (the teaser title: the page's only h1),
 * body paragraphs, CTA as a bold link.
 * The live teaser script uppercases the eyebrow; the authored casing is read
 * back from the page's own .plain.html.
 * D12: an empty CTA ("#") on /subscription goes to the live quiz.
 */
export default function parse(element, { document }) {
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const base = document.location ? document.location.href : 'https://frescopa.coffee/';
  const abs = (u) => new URL(u, base).href.split('?')[0];
  const CTA_FALLBACK = { '/subscription': 'https://frescopa.coffee/quiz' };

  const authored = (shown) => {
    if (!shown) return shown;
    try {
      const xhr = new XMLHttpRequest();
      const path = new URL(base).pathname.replace(/\/$/, '') || '/index';
      xhr.open('GET', `${path}.plain.html`, false);
      xhr.send();
      if (xhr.status !== 200) return shown;
      const doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
      const match = [...doc.querySelectorAll('div, p')]
        .map((n) => n.textContent.replace(/\s+/g, ' ').trim())
        .find((t) => t.toLowerCase() === shown.toLowerCase());
      return match || shown;
    } catch (e) {
      return shown;
    }
  };

  const rows = [['Hero (arch)']];
  const picture = element.querySelector('.background img, picture img, img');
  if (picture && picture.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = abs(picture.getAttribute('src'));
    img.alt = picture.getAttribute('alt') || '';
    rows.push([img]);
  }

  const content = [];
  const eyebrow = text(element.querySelector('.eyebrow'));
  if (eyebrow) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = authored(eyebrow);
    p.append(strong);
    content.push(p);
  }

  const h1 = document.createElement('h1');
  h1.textContent = text(element.querySelector('.title h1, .title h2, .title h3, h1, h2, h3'));
  content.push(h1);

  // body paragraphs keep their inline formatting; the live hard line breaks
  // (set for a wide desktop column) become spaces so the text reflows
  element.querySelectorAll('.long-description p').forEach((src) => {
    if (!text(src)) return;
    const p = document.createElement('p');
    p.innerHTML = src.innerHTML.replace(/\s*<br\s*\/?>\s*/gi, ' ');
    content.push(p);
  });

  const link = element.querySelector('.cta a');
  if (link && text(link)) {
    let href = link.getAttribute('href') || '';
    if (href === '#' || href === '') href = CTA_FALLBACK[new URL(base).pathname.replace(/\/$/, '')] || '';
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text(link);
      const strong = document.createElement('strong');
      strong.append(a);
      const p = document.createElement('p');
      p.append(strong);
      content.push(p);
    }
  }
  rows.push([content]);

  const wrap = document.createElement('div');
  wrap.dataset.d1Style = 'roast';
  wrap.append(WebImporter.DOMUtils.createTable(rows, document));
  element.replaceWith(wrap);
}
