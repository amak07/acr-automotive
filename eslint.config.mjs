import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ["coverage/**", "node_modules/**", ".next/**"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {},
  },
];

export default config;
