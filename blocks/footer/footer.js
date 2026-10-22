import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Groups each heading and the content after it into a footer column inside a nav landmark
 * @param {Element} wrapper The default content wrapper of the links section
 */
function buildLinkColumns(wrapper) {
  const nav = document.createElement('nav');
  nav.className = 'footer-nav';
  nav.setAttribute('aria-label', 'Footer');
  let column;
  [...wrapper.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName) || !column) {
      column = document.createElement('div');
      column.className = 'footer-col';
      nav.append(column);
    }
    column.append(el);
  });
  // plain-text items get the same touch-sized box as links
  nav.querySelectorAll('li').forEach((li) => {
    if (li.querySelector('a') || li.children.length) return;
    const span = document.createElement('span');
    span.textContent = li.textContent.trim();
    li.replaceChildren(span);
  });
  wrapper.append(nav);
}

/**
 * loads and decorates the footer: brand, link columns, legal row
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment?.firstElementChild) footer.append(fragment.firstElementChild);

  const sections = [...footer.querySelectorAll(':scope > .section')];
  if (sections.length >= 3) {
    const [brand, links, legal] = sections;
    brand.classList.add('footer-brand');
    links.classList.add('footer-links');
    legal.classList.add('footer-legal');
    const linksWrapper = links.querySelector('.default-content-wrapper');
    if (linksWrapper) buildLinkColumns(linksWrapper);
  }

  footer.querySelectorAll('a').forEach((a) => {
    a.className = '';
    a.closest('.button-wrapper')?.classList.remove('button-wrapper');
    const logo = a.querySelector('.icon img');
    if (logo) {
      logo.width = 125;
      logo.height = 34;
      if (!a.textContent.trim()) a.setAttribute('aria-label', 'Fréscopa home');
    }
  });

  block.append(footer);
}
