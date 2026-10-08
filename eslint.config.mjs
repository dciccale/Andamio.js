import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['lib/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  {
    files: ['src/*.js', 'examples/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { Andamio: 'readonly', Backbone: 'readonly', _: 'readonly', define: 'readonly' } }
  }
];
