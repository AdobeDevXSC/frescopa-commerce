/* eslint-disable */
/* global WebImporter */

import heroArchParser from './parsers/hero-arch.js';
import storyDawnParser from './parsers/story-dawn.js';
import storyHomeCardsParser from './parsers/story-home-cards.js';
import cardsArchParser from './parsers/cards-arch.js';
import storeLocatorParser from './parsers/store-locator.js';
import rewardParser from './parsers/reward.js';
import homepageSectionsTransformer from './transformers/homepage-sections.js';
import linkRulesTransformer from './transformers/link-rules.js';
import templateSectionsTransformer from './transformers/template-sections.js';

const PAGE_TEMPLATE = {
  "name": "homepage",
  "description": "D1 \"The Ritual\" homepage: hero, three story scenes, shop cards, store locator, reward (docs/migration/homepage-spec.md)",
  "urls": [
    "https://frescopa.coffee/"
  ],
  "blocks": [
    {
      "name": "hero-arch",
      "instances": [
        "main .teaser"
      ]
    },
    {
      "name": "story-dawn",
      "instances": [
        "main .offer"
      ]
    },
    {
      "name": "story-home-cards",
      "instances": [
        "main .section.home .cards"
      ]
    },
    {
      "name": "cards-arch",
      "instances": [
        "main .section.card-tiles .cards"
      ]
    },
    {
      "name": "store-locator",
      "instances": [
        "main .store-locator"
      ]
    },
    {
      "name": "reward",
      "instances": [
        "main .reward"
      ]
    }
  ]
};

const parsers = {
  'hero-arch': heroArchParser,
  'story-dawn': storyDawnParser,
  'story-home-cards': storyHomeCardsParser,
  'cards-arch': cardsArchParser,
  'store-locator': storeLocatorParser,
  reward: rewardParser,
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
