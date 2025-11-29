import js from "@eslint/js";
import globals from "globals";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "module" } },
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
  {
    rules: {
      'no-self-compare': 'error',
      'no-unassigned-vars': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-use-before-define': 'warn',
      'no-useless-assignment': 'warn',
      'require-atomic-updates': 'error',
      'camelcase': 'error',
      'consistent-this': ['error', 'self'],
      'default-case': 'warn',
      'default-case-last': 'error',
      'default-param-last': 'error',
      'dot-notation': 'error',
      'eqeqeq': 'error',
      'guard-for-in': 'error',
      'func-names': 'error',
      'consistent-return': 'warn',
      'no-unused-vars': 'warn',
      'no-implicit-globals': 'error'
    },
  }
]);
