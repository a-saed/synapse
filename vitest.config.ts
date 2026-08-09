import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The default `npm test` loop must stay fast and offline. Integration
    // tests do real `npm install`s into temp dirs and spawn subprocesses, so
    // they are excluded here and run separately via `npm run test:integration`.
    // Note the spread: dropping vitest's own defaults would start scanning
    // node_modules, dist, etc.
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
