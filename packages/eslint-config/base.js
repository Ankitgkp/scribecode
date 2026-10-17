import { createRequire } from "node:module";

import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import onlyWarn from "eslint-plugin-only-warn";

// Resolve the TypeScript preset relative to this config package so consumers
// (which don't install Babel themselves) can still parse TypeScript.
const require = createRequire(import.meta.url);
const typescriptPreset = require.resolve("@babel/preset-typescript");

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [typescriptPreset],
        },
      },
    },
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      // TypeScript handles these checks; the base JS rules produce false positives on type-only code.
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**", "build/**", "node_modules/**"],
  },
];
