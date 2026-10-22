/**
 * decorates the reward panel: teal panel with the ribbon art, copy and CTA
 * @param {Element} block The reward block element
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const panel = document.createElement('div');
  panel.className = 'reward-panel';

  const copy = document.createElement('div');
  copy.className = 'reward-copy';
  cells.forEach((cell) => copy.append(...cell.childNodes));

  const cta = copy.querySelector('.button-wrapper');
  panel.append(copy);
  if (cta) panel.append(cta);
  block.replaceChildren(panel);
}
