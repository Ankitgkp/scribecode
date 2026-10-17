import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A shared ESLint configuration for React applications (Vite SPA).
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  pluginReactHooks.configs.flat.recommended,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
