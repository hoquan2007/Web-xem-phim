import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Allow underscore-prefixed parameters / variables that the
    // ProviderAdapter contract requires us to declare even when a
    // particular provider doesn't need them (e.g. `ophimAdapter.list`
    // never uses `filter`/`signal` because Ophim doesn't expose a
    // catalogue endpoint).
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // FIX-10.3: Playwright tests live outside src/ and use their own globals.
    "tests/**",
    "playwright-report/**",
    "test-results/**",
    // Sandbox loader scripts and the test runner itself live outside
    // src/. Linted only when explicitly requested via `--ext`.
    "scripts/_register-test-loader.mjs",
    "scripts/_test-loader.mjs",
  ]),
]);

export default eslintConfig;
