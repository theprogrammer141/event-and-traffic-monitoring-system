const js = require('@eslint/js');
const globals = require('globals');
const legacyConfig = require('./.eslintrc.json');

module.exports = [
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: legacyConfig.parserOptions.ecmaVersion,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...legacyConfig.rules,
    },
  },
];
