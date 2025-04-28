import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // React Rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      
      // Best Practices
      "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
      "no-debugger": "warn",
      "eqeqeq": ["error", "always"],
      
      // Formatting
      "quotes": ["warn", "double"],
      "semi": ["warn", "always"]
    }
  }
];

export default eslintConfig;