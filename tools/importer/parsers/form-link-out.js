/* eslint-disable */
/* global WebImporter */

/**
 * Live AEM adaptive forms are not migrated (Phase 0 decision D5): the form is
 * dropped and its intro copy stays. D13: a sentence that points to "the form
 * below" keeps its wording and links to the live page, where the form works.
 */
export default function parse(element, { document }) {
  const base = document.location ? document.location.href : 'https://frescopa.coffee/';
  const live = `https://frescopa.coffee${new URL(base).pathname.replace(/\/$/, '')}`;

  const wrapper = element.parentElement;
  const section = element.closest('.section') || wrapper;
  const pointer = [...section.querySelectorAll('.default-content-wrapper p')]
    .find((p) => /form below/i.test(p.textContent) && !p.querySelector('a'));
  if (pointer) {
    const a = document.createElement('a');
    a.href = live;
    a.dataset.d1Live = 'true';
    a.textContent = pointer.textContent.replace(/\s+/g, ' ').trim();
    pointer.replaceChildren(a);
  }
  element.remove();
}
