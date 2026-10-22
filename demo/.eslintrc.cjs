// Node CLI tooling for the demo kit. Inherits the repo's airbnb-base config.
module.exports = {
  env: { node: true, browser: false },
  rules: {
    'import/extensions': ['error', { js: 'always', mjs: 'always' }],
    // deps live in demo/node_modules, which CI does not install for the site lint
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-console': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': 'off',
    'import/prefer-default-export': 'off',
    'max-len': ['error', { code: 140, ignoreStrings: true, ignoreTemplateLiterals: true }],
  },
};
