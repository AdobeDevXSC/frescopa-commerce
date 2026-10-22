import { createOptimizedPicture } from '../../scripts/aem.js';
import blendOpaqueImages from '../../scripts/blend.js';

export default function decorate(block) {
  const arch = block.classList.contains('arch');
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  if (arch) {
    // arch cards keep the delivered (already optimized) pictures; decorative icons have no alt
    ul.querySelectorAll('.cards-card-image img').forEach((img) => {
      if (!img.alt) img.closest('.cards-card-image').classList.add('cards-card-icon');
    });
    blendOpaqueImages(ul.querySelectorAll('.cards-card-image img'));
  } else {
    ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  }
  block.replaceChildren(ul);
}
