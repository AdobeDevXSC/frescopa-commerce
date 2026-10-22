import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// above this width the primary nav is inline; at or below it collapses behind the menu button
const isDesktop = window.matchMedia('(width > 1120px)');

const SVG = 'viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
const ICONS = {
  search: `<svg ${SVG}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>`,
  cart: `<svg ${SVG}><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>`,
  account: `<svg ${SVG}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></svg>`,
};

/**
 * Collapses every open dropdown in the primary nav
 * @param {Element} nav The primary nav element
 */
function closeDropdowns(nav) {
  nav.querySelectorAll('.nav-drop > button[aria-expanded="true"]').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Opens or closes the collapsed (≤1120px) menu
 * @param {Element} block The header block
 * @param {boolean} open Whether the menu should be open
 * @param {boolean} [returnFocus] Move focus back to the menu button
 */
function setMenu(block, open, returnFocus = false) {
  const button = block.querySelector('.nav-hamburger');
  if (!button) return;
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (!open) closeDropdowns(block.querySelector('.nav-menu'));
  if (returnFocus) button.focus();
}

/**
 * Wraps each authored sub-list in a disclosure button (supports nested nav lists)
 * @param {Element} sections The nav sections container
 */
function decorateDropdowns(sections) {
  sections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((item) => {
    const subList = item.querySelector(':scope > ul');
    if (!subList) return;
    item.classList.add('nav-drop');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    [...item.childNodes].forEach((node) => {
      if (node !== subList) button.append(node);
    });
    item.prepend(button);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (isDesktop.matches) closeDropdowns(sections);
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  });
}

/**
 * Builds the tools area: inert search and cart buttons, then the authored links
 * @param {Element} [section] The authored tools section
 * @returns {Element} The tools container
 */
function buildTools(section) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  [['search', 'Search'], ['cart', 'Cart']].forEach(([icon, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nav-tool nav-tool-${icon}`;
    button.setAttribute('aria-label', label);
    button.innerHTML = ICONS[icon];
    tools.append(button);
  });
  if (!section) return tools;

  section.querySelectorAll('a').forEach((link) => {
    link.className = '';
    const icon = link.querySelector('.icon');
    const iconName = icon && [...icon.classList].find((c) => c.startsWith('icon-'))?.substring(5);
    if (icon && ICONS[iconName]) {
      // icon-only link: inline the svg so it follows currentColor, keep the text for screen readers
      const label = document.createElement('span');
      label.className = 'nav-tool-label';
      label.textContent = link.textContent.trim();
      icon.outerHTML = ICONS[iconName];
      [...link.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.remove();
      });
      link.append(label);
      link.classList.add('nav-tool', `nav-tool-${iconName}`);
    } else {
      link.classList.add('nav-tool-text');
    }
    tools.append(link);
  });
  return tools;
}

/**
 * loads and decorates the header: skip link, announcement bar, brand, primary nav and tools
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  if (!fragment) return;

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const skip = document.createElement('a');
  skip.className = 'nav-skip';
  skip.href = `#${main ? main.id : 'main'}`;
  skip.textContent = 'Skip to content';
  block.append(skip);

  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const announcementSection = sections.find((s) => s.classList.contains('announcement'));
  const [brandSection, linksSection, toolsSection] = sections
    .filter((s) => s !== announcementSection);

  // announcement bar: authored first section with style "announcement"
  if (announcementSection) {
    const announcement = document.createElement('div');
    announcement.className = 'nav-announcement';
    announcement.setAttribute('role', 'region');
    announcement.setAttribute('aria-label', 'Promotion');
    const inner = document.createElement('div');
    inner.className = 'nav-announcement-inner';
    announcementSection.querySelectorAll('.default-content-wrapper > *').forEach((el) => {
      el.querySelectorAll('a').forEach((a) => { a.className = ''; });
      inner.append(el);
    });
    announcement.append(inner);
    block.append(announcement);
  } else {
    block.closest('header')?.classList.add('no-announcement');
  }

  const bar = document.createElement('div');
  bar.className = 'nav-bar';

  // brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const brandLink = brandSection.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const logo = brandLink.querySelector('img');
      if (logo) {
        logo.width = 125;
        logo.height = 34;
        logo.loading = 'eager';
      }
      if (!brandLink.textContent.trim()) brandLink.setAttribute('aria-label', 'Fréscopa home');
      brand.append(brandLink);
    } else {
      brand.append(...brandSection.querySelector('.default-content-wrapper')?.children || []);
    }
  }
  bar.append(brand);

  // menu button for ≤1120px
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon" aria-hidden="true"></span><span>Menu</span>';
  bar.append(hamburger);

  // primary nav: links + tools
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'nav-menu';
  nav.setAttribute('aria-label', 'Primary');
  if (linksSection) {
    linksSection.classList.add('nav-sections');
    linksSection.querySelectorAll('a').forEach((a) => { a.className = ''; });
    decorateDropdowns(linksSection);
    nav.append(linksSection);
  }
  nav.append(buildTools(toolsSection));
  bar.append(nav);

  hamburger.addEventListener('click', () => {
    setMenu(block, hamburger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && !isDesktop.matches) setMenu(block, false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!isDesktop.matches && hamburger.getAttribute('aria-expanded') === 'true') {
      setMenu(block, false, true);
    } else {
      const open = nav.querySelector('.nav-drop > button[aria-expanded="true"]');
      if (open) {
        closeDropdowns(nav);
        open.focus();
      }
    }
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) closeDropdowns(nav);
  });
  isDesktop.addEventListener('change', () => setMenu(block, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(bar);
  block.append(navWrapper);
}
