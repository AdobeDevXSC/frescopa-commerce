/* eslint-disable */
/* global WebImporter */

import pageHeroParser from './parsers/page-hero.js';
import headingHeroParser from './parsers/heading-hero.js';
import featureColumnsParser from './parsers/feature-columns.js';
import formLinkOutParser from './parsers/form-link-out.js';
import homepageSectionsTransformer from './transformers/homepage-sections.js';
import linkRulesTransformer from './transformers/link-rules.js';
import templateSectionsTransformer from './transformers/template-sections.js';

const PAGE_TEMPLATE = {
  "name": "content",
  "description": "Content page: page hero, prose, feature columns",
  "urls": [
    "https://frescopa.coffee/sustainability",
    "https://frescopa.coffee/about-us",
    "https://frescopa.coffee/business",
    "https://frescopa.coffee/subscription",
    "https://frescopa.coffee/contact-us"
  ],
  "blocks": [
    {
      "name": "page-hero",
      "instances": [
        "main .teaser:not(.dark)"
      ]
    },
    {
      "name": "heading-hero",
      "instances": [
        "main > .section:first-child > .default-content-wrapper:first-child"
      ]
    },
    {
      "name": "feature-columns",
      "instances": [
        "main .cards",
        "main .teaser.dark"
      ]
    },
    {
      "name": "form-link-out",
      "instances": [
        "main .embed-adaptive-form",
        "main .form"
      ]
    }
  ]
};

const parsers = {
  'page-hero': pageHeroParser,
  'heading-hero': headingHeroParser,
  'feature-columns': featureColumnsParser,
  'form-link-out': formLinkOutParser,
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
