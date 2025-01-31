import globals from 'globals';
import { FlatCompat } from "@eslint/eslintrc";
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import {
  createTypeScriptImportResolver,
} from 'eslint-import-resolver-typescript';

const compat = new FlatCompat();

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    }
  },
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
      },
      "import/resolver": {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        "typescript": true,
        "node": true,
      },
      "import/resolver-next": [
        createTypeScriptImportResolver(),
      ],
      // "import/ignore": [
      //   "^react$",
      // ],
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  ...compat.extends('plugin:react-hooks/recommended'),
  reactRefresh.configs.vite,
  importPlugin.flatConfigs.recommended,
  ...compat.extends('plugin:import/typescript'),
  {
    rules: {
      semi: ['error', 'always'],

      // Import Rules
      'import/order': ['warn', {
        "named": true,
        "alphabetize": {
          "order": "asc",
        }
      }],
      "import/no-named-as-default": "off",

      // Extra Typescript rules
      '@typescript-eslint/prefer-find': 'warn',
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',
      "@typescript-eslint/prefer-nullish-coalescing": "warn",

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

      // Disabling for now until we understand the implications
      "@typescript-eslint/unbound-method": "off",

      // React rules
      "react/prefer-stateless-function": "error",
      "react/button-has-type": "error",
      "react/no-unused-prop-types": "error",
      "react/jsx-pascal-case": "error",
      "react/jsx-no-script-url": "error",
      "react/no-children-prop": "error",
      "react/no-danger": "error",
      "react/no-danger-with-children": "error",
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/jsx-fragments": "error",
      "react/destructuring-assignment": [
        "error",
        "always",
        { destructureInSignature: "always" },
      ],
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["coerce", "ternary"] }],
      "react/jsx-max-depth": ["error", { max: 5 }],
      "react/function-component-definition": [
        "warn",
      ],
      "react/jsx-key": [
        "error",
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-curly-brace-presence": ["warn",
        { "propElementValues": "always" }
      ],
      "react/no-typos": "warn",
      "react/display-name": "warn",
      "react/self-closing-comp": "warn",
      "react/react-in-jsx-scope": "off",
      "react/jsx-one-expression-per-line": "off",
      "react/prop-types": "off",
      "react/no-array-index-key": 'warn',
      "react-refresh/only-export-components": "warn",
      "react/jsx-no-constructed-context-values": "error",
      "react/jsx-sort-props": ["warn",
        { "reservedFirst": true }
      ]
    },
  },
];


// Naming conventions
// "@typescript-eslint/naming-convention": [
//   "warn",
//   {
//     selector: "default",
//     format: ["camelCase"],
//     leadingUnderscore: "allow",
//   },
//   {
//     selector: "variable",
//     // Specify PascalCase for React components
//     format: ["PascalCase", "camelCase", "UPPER_CASE"],
//     leadingUnderscore: "allow",
//   },
//   // {
//   //   "selector": "variable",
//   //   "types": ["boolean"],
//   //   "format": ["PascalCase"],
//   //   "prefix": ["is", "should", "has", "can", "did", "will", "are"]
//   // },
//   {
//     selector: "parameter",
//     format: ["camelCase"],
//     leadingUnderscore: "allow",
//   },
//   {
//     selector: "property",
//     format: null,
//     leadingUnderscore: "allow",
//   },
//   {
//     selector: "typeLike",
//     format: ["PascalCase"],
//   },
//   {
//     "selector": "variable",
//     "modifiers": ["destructured"],
//     "format": null,
//   },
// ],