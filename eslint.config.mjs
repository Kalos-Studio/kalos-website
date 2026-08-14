import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

/**
 * eslint-config-next still ships as an eslintrc-style config, so it comes in
 * through FlatCompat rather than directly.
 *
 * "core-web-vitals" over plain "next" on purpose: it promotes the image and
 * script rules from warnings to errors, and those are the ones that actually
 * cost something on a phone.
 */
const config = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // The hooks in app/lab drive an imperative render loop, where a stale
      // closure reads as a subtly wrong animation rather than a crash — the
      // kind of bug that is very hard to spot by eye. Worth erroring on.
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },
];

export default config;
