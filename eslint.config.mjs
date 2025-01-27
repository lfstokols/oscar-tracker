import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  {
    settings: {
      react: {
        version: 'detect',
        componentWrapperFunctions: [
          { "property": "styled" },
        ],
        formComponents: [
          'FormControl',
        ],
        linkComponents: [
          { "name": "Link", "linkAttribute": "href" },
        ]
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    rules: {
      semi: ['error', 'always'],
      // 'typescript-eslint:no-unused-vars': 'error',

      // Extra Typescript rules
      // '@typescript-eslint/prefer-find': 'warn',

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],

      // "no-restricted-imports": [
      //   "error",
      //   {
      //     // "patterns": ["@mui/*/*/*"]
      //   }
      // ]
    },
  },
];
