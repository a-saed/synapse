import { configDefaults, defineWorkspace } from "vitest/config";

// Single source of truth for how this monorepo's tests are split, since
// Vitest 2.1 auto-discovers a root-level `vitest.workspace.*` file and, once
// present, that discovery takes priority over resolving a separate root
// `--config` file for a plain `defineConfig` — so two competing entry points
// (a bare `vitest.config.ts` for the fast loop and a `vitest.integration.config.ts`
// selected via `--config`) do not reliably coexist. Instead, every test-running
// mode is a named project in this one file, selected via `vitest run --project <name>`.
//
// - "web": apps/web's own React Testing Library suites. Referenced as a bare
//   glob string (not an inline `{ extends: ... }` object) so Vitest resolves
//   the project's root, config file, and relative paths (setupFiles etc.)
//   from apps/web/vite.config.ts's own directory — an inline `extends` from
//   the repo root does not correctly rescope those relative paths or the
//   file-scanning root. This gets jsdom, apps/web/vitest.setup.ts, and the
//   React plugin. A package-scoped config is never consulted when vitest runs
//   from the repo root, so without this, apps/web's DOM tests fail with
//   "document is not defined" under a bare root-level `vitest run`.
// - "backend": apps/server and packages/* tests, Node environment (Vitest's
//   default), integration tests excluded.
// - "integration": exactly the `*.integration.test.ts` files (real npm
//   installs into temp dirs, spawned subprocesses) — run separately via
//   `npm run test:integration`, never part of the default fast loop.
//
// Every project also excludes `**/.claude/**`: Claude Code worktrees live at
// `.claude/worktrees/<name>/` inside this repo (gitignored, but not excluded
// from vitest's own file-glob scanning by default). Without this, running
// `npm test` from the repo root while a worktree exists double-counts every
// backend/integration test file — once at its real path, once nested inside
// the worktree copy — and the duplicate runs race on shared fixture state
// (e.g. apps/server's on-disk project storage), producing spurious failures.
export default defineWorkspace([
  "./apps/web",
  {
    test: {
      name: "backend",
      exclude: [
        ...configDefaults.exclude,
        "**/*.integration.test.ts",
        "apps/web/**",
        "**/.claude/**",
      ],
    },
  },
  {
    test: {
      name: "integration",
      include: ["**/*.integration.test.ts"],
      exclude: [...configDefaults.exclude, "**/.claude/**"],
    },
  },
]);
