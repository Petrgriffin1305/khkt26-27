import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**", "backend/**", "desktop/**", "public/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
