// decorative coffee bean; colours come from CSS (currentColor and --bean-line)
const BEAN = '<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><ellipse cx="20" cy="30" rx="16" ry="26" fill="currentColor"/><path d="M20 6c-7 12 7 18 0 30s6 14 0 18" fill="none" stroke="var(--bean-line, var(--roast))" stroke-width="2.5" stroke-linecap="round"/></svg>';

/**
 * A paragraph that is entirely bold (and not a link) is a label line
 * @param {Element} p The paragraph
 * @returns {boolean} Whether it is a label
 */
function isLabel(p) {
  const strong = p.querySelector(':scope > strong');
  return !!strong && !p.querySelector('a') && strong.textContent.trim() === p.textContent.trim();
}

/**
 * Arch variant: text column (label, h1, body, CTA) beside the photo in an arch
 * frame, with an amber circle and four floating beans (decoration only).
 * Without a photo the text spans the full width.
 * @param {Element} block The hero block element
 */
function decorateArch(block) {
  const picture = block.querySelector('picture');
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const textCell = cells.find((cell) => !cell.querySelector('picture') && cell.textContent.trim());

  const text = document.createElement('div');
  text.className = 'hero-text';
  if (textCell) text.append(...textCell.childNodes);
  text.querySelectorAll(':scope > p:not(.button-wrapper)').forEach((p) => {
    if (!p.textContent.trim()) return;
    if (isLabel(p)) {
      p.classList.add('hero-label');
      p.replaceChildren(p.textContent.trim());
    } else {
      p.classList.add('hero-body');
    }
  });

  const media = document.createElement('div');
  media.className = 'hero-media';
  if (!picture) block.classList.add('hero-text-only');
  if (picture) {
    const frame = document.createElement('div');
    frame.className = 'hero-frame';
    const img = picture.querySelector('img');
    img.loading = 'eager';
    img.fetchPriority = 'high';
    frame.append(picture);
    media.append(frame);
  }

  const beans = [1, 2, 3, 4].map((n) => {
    const bean = document.createElement('span');
    bean.className = `hero-bean hero-bean-${n}`;
    bean.setAttribute('aria-hidden', 'true');
    bean.innerHTML = BEAN;
    return bean;
  });

  block.replaceChildren(text, media, ...beans);
}

/**
 * decorates the hero block
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  if (block.classList.contains('arch')) decorateArch(block);
}
