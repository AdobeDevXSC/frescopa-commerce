import blendOpaqueImages from '../../scripts/blend.js';

const BEAN = '<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><ellipse cx="20" cy="30" rx="16" ry="26" fill="currentColor"/><path d="M20 6c-7 12 7 18 0 30s6 14 0 18" fill="none" stroke="var(--bean-line, var(--roast))" stroke-width="2.5" stroke-linecap="round"/></svg>';

// pinned, scroll-driven scenes only on large screens with motion allowed;
// everywhere else (and without JS) the finished static layout shows
const largeScreen = window.matchMedia('(min-width: 1100px) and (min-height: 720px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenes = new Set();
let queued = false;

const motionAllowed = () => largeScreen.matches && !reducedMotion.matches;

/**
 * Sets --p (0 to 1) on every enhanced scene near the viewport. A scene whose
 * focus lock is set keeps --p = 1.
 */
function update() {
  queued = false;
  const vh = window.innerHeight;
  const navHeight = document.querySelector('header .nav-wrapper')?.offsetHeight || 73;
  scenes.forEach((section) => {
    if (!section.classList.contains('story-enhanced') || section.dataset.storyLock) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < -vh || rect.top > 2 * vh) return;
    const travel = rect.height - (vh - navHeight);
    const p = travel > 0 ? Math.min(1, Math.max(0, (navHeight - rect.top) / travel)) : 1;
    section.style.setProperty('--p', p.toFixed(4));
  });
}

function queue() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(update);
}

function applyMotion() {
  const on = motionAllowed();
  scenes.forEach((section) => {
    section.classList.toggle('story-enhanced', on);
    if (!on) section.style.removeProperty('--p');
  });
  if (on) queue();
}

function watch(section) {
  if (!scenes.size) {
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    largeScreen.addEventListener('change', applyMotion);
    reducedMotion.addEventListener('change', applyMotion);
  }
  scenes.add(section);

  // keyboard: a focused scene shows its final state until focus leaves it
  section.addEventListener('focusin', () => {
    section.dataset.storyLock = 'true';
    if (section.classList.contains('story-enhanced')) section.style.setProperty('--p', '1');
  });
  section.addEventListener('focusout', (e) => {
    if (section.contains(e.relatedTarget)) return;
    delete section.dataset.storyLock;
    queue();
  });
  applyMotion();
}

function bean(n) {
  const el = document.createElement('span');
  el.className = `story-bean story-bean-${n}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = BEAN;
  return el;
}

/**
 * decorates a story scene (variants: dawn, tasting, personal)
 * @param {Element} block The story block element
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')];
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const textCell = cells.find((cell) => !cell.querySelector('picture') && cell.textContent.trim());

  const text = document.createElement('div');
  text.className = 'story-text';
  if (textCell) text.append(...textCell.childNodes);
  const heading = text.querySelector('h1, h2, h3');

  const media = document.createElement('div');
  media.className = 'story-media';
  if (block.classList.contains('personal')) {
    media.classList.add('story-objects');
    pictures.forEach((picture, i) => {
      picture.classList.add(i === 0 ? 'story-pod' : 'story-mug');
      media.append(picture);
    });
  } else if (block.classList.contains('tasting')) {
    media.classList.add('story-bag');
    media.append(...pictures, ...[1, 2, 3, 4].map(bean));
  } else {
    media.classList.add('story-sun');
    media.append(...pictures);
  }
  blendOpaqueImages(media.querySelectorAll('img'));

  const grid = document.createElement('div');
  grid.className = 'story-grid';
  grid.append(media, text);

  const inner = document.createElement('div');
  inner.className = 'story-inner';
  // personal: the giant heading sits above the two columns
  if (block.classList.contains('personal') && heading) inner.append(heading);
  inner.append(grid);

  // every remaining text element is a step that fades in with the scroll
  [...text.children].forEach((child) => child.classList.add('story-step'));

  const stage = document.createElement('div');
  stage.className = 'story-stage';
  stage.append(inner);
  block.replaceChildren(stage);

  const section = block.closest('.section');
  if (section) watch(section);
}
