/* eslint-disable */
/* global WebImporter */

/**
 * Homepage sections for the D1 design.
 *
 * Parsers wrap their output in <div data-d1-order data-d1-style>. After parsing,
 * this keeps only those scenes, in D1 order (hero, dawn, tasting, personal, shop,
 * locator, reward), each as its own section with a Section Metadata `Style`
 * (its ground). Everything else on the live page is not migrated: header,
 * footer, the Google Maps embed, the 10% offer stamp and the unplaced image
 * stack below the rewards banner (docs/migration/content-inventory.md).
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform' || payload.template?.name !== 'homepage') return;
  const { document } = payload;

  const scenes = [...element.querySelectorAll('[data-d1-order]')]
    .sort((a, b) => Number(a.dataset.d1Order) - Number(b.dataset.d1Order));
  if (!scenes.length) return;

  const out = [];
  scenes.forEach((scene, i) => {
    if (i) out.push(document.createElement('hr'));
    out.push(...scene.childNodes);
    out.push(WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['Style', scene.dataset.d1Style],
    ], document));
  });
  element.replaceChildren(...out);
}
