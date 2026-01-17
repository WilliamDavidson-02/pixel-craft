import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  prettierConfig,
  js.configs.recommended,
  sonarjs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    ignores: ["dist", "node_modules"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: ["./tsconfig.json"],
      },
      globals: globals.browser,
    },

    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      "@typescript-eslint": tseslint.plugin,
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      /* --- Prettier --- */
      "prettier/prettier": [
        "error",
        {
          semi: true,
          singleQuote: false,
          trailingComma: "all",
          printWidth: 100,
          tabWidth: 2,
          bracketSpacing: true,
          arrowParens: "always",
        },
      ],

      /* --- Imports --- */
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "no-duplicate-imports": "error",

      /* --- TypeScript --- */
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-inferrable-types": "off",

      /* --- SonarJS --- */
      "sonarjs/no-commented-code": "off",
      "sonarjs/cognitive-complexity": ["error", 20],
      "sonarjs/todo-tag": "warn",
      "sonarjs/pseudo-random": "off",
    },
  },
]);
