/* eslint-disable */
/* global WebImporter */

/**
 * Sections for the D1 template pages (category, content, locations).
 *
 * Parsers wrap their output in <div data-d1-style>. After parsing, the page is
 * rebuilt in its live order: each parsed block becomes its own section with a
 * Section Metadata `Style` (its ground); prose between blocks is grouped into a
 * `crema` section. Live blocks without a parser are not migrated (Phase 0
 * decisions D5–D7: forms, the Scene7 offer image, the empty store locator,
 * the webinar CTA, the sustainability video, the quiz widget).
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform' || payload.template?.name === 'homepage') return;
  const { document } = payload;
  const main = element.querySelector('main') || element;

  const scenes = [];
  const prose = () => {
    const last = scenes[scenes.length - 1];
    if (last && last.prose) return last;
    const scene = { style: 'crema', prose: true, nodes: [] };
    scenes.push(scene);
    return scene;
  };

  main.querySelectorAll(':scope > div').forEach((section) => {
    [...section.children].forEach((wrapper) => {
      if (wrapper.dataset && wrapper.dataset.d1Style) {
        scenes.push({ style: wrapper.dataset.d1Style, nodes: [...wrapper.childNodes] });
        return;
      }
      [...wrapper.children].forEach((child) => {
        if (child.dataset && child.dataset.d1Style) {
          // a parsed block: prose-only output (article teaser) joins the prose
          if (child.dataset.d1Style === 'crema' && !child.querySelector('table')) {
            prose().nodes.push(...child.childNodes);
          } else {
            scenes.push({ style: child.dataset.d1Style, nodes: [...child.childNodes] });
          }
        } else if (wrapper.classList.contains('default-content-wrapper') && child.textContent.trim()) {
          prose().nodes.push(child);
        }
      });
    });
  });
  if (!scenes.length) return;

  const out = [];
  scenes.forEach((scene, i) => {
    if (i) out.push(document.createElement('hr'));
    out.push(...scene.nodes);
    out.push(WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['Style', scene.style],
    ], document));
  });
  element.replaceChildren(...out);
}
