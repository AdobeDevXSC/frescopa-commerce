/* eslint-disable */
/* global WebImporter */

import pageHeroParser from './parsers/page-hero.js';
import productCardsParser from './parsers/product-cards.js';
import articleTeaserParser from './parsers/article-teaser.js';
import formLinkOutParser from './parsers/form-link-out.js';
import homepageSectionsTransformer from './transformers/homepage-sections.js';
import linkRulesTransformer from './transformers/link-rules.js';
import templateSectionsTransformer from './transformers/template-sections.js';

const PAGE_TEMPLATE = {
  "name": "category",
  "description": "Category landing: page hero, product cards linking to the live store (D11), article teaser, enquiry copy",
  "urls": [
    "https://frescopa.coffee/coffee",
    "https://frescopa.coffee/machines",
    "https://frescopa.coffee/accessories",
    "https://frescopa.coffee/en/tea"
  ],
  "blocks": [
    {
      "name": "page-hero",
      "instances": [
        "main .teaser:not(.dark)"
      ]
    },
    {
      "name": "product-cards",
      "instances": [
        "main .product-list-page-custom"
      ]
    },
    {
      "name": "article-teaser",
      "instances": [
        "main .article"
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
  'product-cards': productCardsParser,
  'article-teaser': articleTeaserParser,
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
