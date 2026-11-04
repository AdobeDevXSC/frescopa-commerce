/* eslint-disable */
/* global WebImporter */

import headingHeroParser from './parsers/heading-hero.js';
import storeLocatorParser from './parsers/store-locator.js';
import homepageSectionsTransformer from './transformers/homepage-sections.js';
import linkRulesTransformer from './transformers/link-rules.js';
import templateSectionsTransformer from './transformers/template-sections.js';

const PAGE_TEMPLATE = {
  "name": "locations",
  "description": "Locations: page hero and the store locator (ZIP form + static address card, D4)",
  "urls": [
    "https://frescopa.coffee/locations"
  ],
  "blocks": [
    {
      "name": "heading-hero",
      "instances": [
        "main > .section:first-child > .default-content-wrapper:first-child"
      ]
    },
    {
      "name": "store-locator",
      "instances": [
        "main .store-locator"
      ]
    }
  ]
};

const parsers = {
  'heading-hero': headingHeroParser,
  'store-locator': storeLocatorParser,
};
// section transformers act on their own template only; link rules apply to all
const transformers = [homepageSectionsTransformer, linkRulesTransformer, templateSectionsTransformer];

// live paths that are migrated under another path (Phase 0 decision D1)
const PATH_ALIASES = { '/en/tea': '/tea' };

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    // metadata in its own section: the local preview server only strips it there;
    // the empty section it leaves after publishing is hidden by styles.css
    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    let rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    rawPath = PATH_ALIASES[rawPath] || rawPath;
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
