import { configDefaults, defineConfig } from "vitest/config";

// Companion to vitest.config.ts, which excludes `*.integration.test.ts` from
// the fast default loop. This config runs exactly those excluded files.
// (A CLI `--exclude` override does not work here: vitest merges it with the
// root config's exclude rather than replacing it, so the integration files
// stay filtered out. A separate config is the reliable split.)
export default defineConfig({
  test: {
    include: ["**/*.integration.test.ts"],
    exclude: [...configDefaults.exclude],
    // Each integration test sets its own generous timeout inline (they do real
    // `npm install`s and spawn subprocesses), so no global override is needed.
  },
});
