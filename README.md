# Synapse

Synapse is a **visual builder for MCP servers**. This repository contains the
**v1 backend engine** — there is **no UI yet**. The canvas / playground front end
is a separate, future plan; everything here is driven over HTTP.

The engine lets you:

- **Compose a project** out of MCP primitives — `tool`, `resource` and `prompt`
  nodes, each backed by a JavaScript **Code block** — grouped into groups, with
  an explicit list of groups exposed by the exported server.
- **Run a node live** in a sandboxed playground, so you can see what a Code
  block returns before exporting anything.
- **Export the project** either as a **standalone, downloadable MCP server**
  (a zip containing a runnable `index.ts`, `package.json` and `README.md`) or as
  a **paste-ready Claude Desktop config snippet** pointing at that server.

## Layout

| Path                      | What it is                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| `packages/config-schema`  | Zod schema + types for a `SynapseProject` (nodes, groups, exposure) |
| `packages/codegen`        | Turns a project into the files of a standalone MCP server           |
| `apps/server`             | Express API: project CRUD, sandboxed node execution, export routes  |

## Running it in dev

```bash
npm install                       # from the repo root — npm workspaces
npm run dev --workspace @synapse/server
```

`dev` runs `tsx watch src/index.ts`.

Configuration is via environment variables:

| Variable           | Default   | Meaning                                       |
| ------------------ | --------- | --------------------------------------------- |
| `PORT`             | `4000`    | Port the API listens on                       |
| `SYNAPSE_DATA_DIR` | `./data`  | Directory projects are persisted into as JSON |

Once running, the API is at `http://127.0.0.1:4000`:

```
GET    /health
POST   /projects
GET    /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id
POST   /projects/:projectId/nodes/:nodeId/execute   # sandboxed playground run
GET    /projects/:id/export/snippet                 # Claude Desktop config JSON
GET    /projects/:id/export/archive                 # zip of a standalone server
```

## Security

**Read this before running Synapse anywhere but your own machine.**

- **The server binds to `127.0.0.1` only, by design.** This is deliberate (and
  was a fix on this branch — it previously bound all interfaces). Do not change
  it to `0.0.0.0` or put it behind a public reverse proxy.
- **There is no authentication.** Per the v1 design, none is implemented. Every
  route is open to anyone who can reach the port, which is why the port must
  never be reachable beyond localhost.
- **Code blocks execute with the server process's OS privileges.** The
  worker-thread sandbox (`apps/server/src/sandbox/worker.cjs`) buys exactly two
  things: **process/memory hygiene** (a crash or runaway allocation kills the
  worker, not the Express server) and **timeout enforcement** (`worker.terminate()`
  when the deadline passes, which kills even a synchronous infinite loop).
  Node's `vm` module is **not** a security boundary — it isolates evaluated code
  from the surrounding lexical scope, not from the host realm, and the sandbox
  only removes the known, trivial escape hatches. It is **not** a defence against
  malicious code. See the SECURITY NOTE at the top of `worker.cjs`.
- **Code block content must be treated as trusted input.** Never load, import or
  execute a project authored by someone you do not trust.

## Testing

Tests are split into a fast loop and a slow one:

```bash
npm test              # fast: unit + API tests, fully offline, ~2s
npm run test:integration   # slow: real npm installs + subprocess spawns, needs network
```

- `npm test` uses `vitest.config.ts`, which extends vitest's default excludes
  with `**/*.integration.test.ts` so the slow tests stay out of the default loop.
- `npm run test:integration` uses `vitest.integration.config.ts`, which runs
  exactly those excluded files. They generate a server, `npm install` it into a
  temp directory and drive it with a **real MCP client over stdio**, so they
  require network access and take tens of seconds.

Type checking:

```bash
npm run typecheck     # runs `tsc --noEmit` in every workspace that has it
```

## Known limitation: no production build

**There is no production build step. Everything runs via `tsx`** — the dev
server, the generated servers, and the integration tests.

This is a **deliberate, known limitation, not an oversight.**
`apps/server/src/sandbox/run.ts` resolves its worker as:

```ts
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, "worker.cjs");
```

`worker.cjs` is intentionally not a `.ts` file, and a naive `tsc` build to
`dist/` would not copy it — so `import.meta.url`-relative resolution would
point at a `dist/sandbox/worker.cjs` that does not exist, and every sandboxed
execution would fail at runtime. Producing a correct build means teaching the
build step to carry non-TS assets alongside the compiled output (and verifying
the resolution still holds from `dist/`). That work is deferred to a future
build-tooling task.
