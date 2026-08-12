# Synapse

Synapse is a **visual builder for MCP servers**: a backend engine plus a
canvas-based workspace UI, driven over HTTP.

The app lets you:

- **Compose a project** out of MCP primitives — `tool`, `resource` and `prompt`
  nodes, each backed by a JavaScript **Code block** — grouped into groups, with
  an explicit list of groups exposed by the exported server.
- **Run a node live** in a sandboxed playground, so you can see what a Code
  block returns before exporting anything.
- **Export the project** either as a **standalone, downloadable MCP server**
  (a zip containing a runnable `index.ts`, `package.json` and `README.md`) or as
  a **paste-ready Claude Desktop config snippet** pointing at that server.

- [Quick start: build your first MCP server](#quick-start-build-your-first-mcp-server)
  - [Writing Code blocks](#writing-code-blocks)
- [Layout](#layout)
- [Running it in dev](#running-it-in-dev)
- [Security](#security)
- [Testing](#testing)
- [Known limitation: no production build](#known-limitation-no-production-build)

## Quick start: build your first MCP server

This walks through the whole loop — the payoff is a real tool an AI client
can call, not just a demo project sitting in the UI.

1. **Start both processes** (see [Running it in dev](#running-it-in-dev)
   below), then open `http://localhost:5173`.
2. **Create a project** from the project list, then open it — you land on the
   canvas.
3. **Add a Tool node** (`+` button, top-left). Give it a name, e.g.
   `current_time`. In its Code box:
   ```js
   return new Date().toISOString();
   ```
   A node's code always ends by `return`ing a **string** — see
   [Writing Code blocks](#writing-code-blocks) for the full constraints.
4. **Add a Group**, drag the tool into it (or assign it via the node editor's
   Group dropdown), and toggle the group's **Exposed** switch — only exposed
   groups ship in the export.
5. **Test it before exporting.** Open the command palette (`Cmd/Ctrl+K`) →
   "Open playground", pick the node, hit Run, and confirm you get a real
   result back — this executes the same sandboxed code path a real MCP call
   would use.
6. **Export it.** Click **Export** → **Download standalone server (.zip)**.
   Unzip it: you get `index.ts`, `package.json`, `README.md` — a complete
   project with zero runtime dependency on Synapse. Also click **Copy Claude
   Desktop config** to get the exact JSON block for the next step.
7. **Run the generated server standalone** to confirm it's real, working
   code:
   ```bash
   cd <unzipped-folder>
   npm install
   npx tsx index.ts
   ```
   It will sit idle with no output — that's correct. It speaks MCP over
   stdio and is waiting for a client, not serving HTTP.
8. **Wire it into an actual AI client.** Paste the copied snippet into
   `claude_desktop_config.json` (or Claude Code's MCP config), adjusting the
   path to your unzipped `index.ts`, then restart the client. Ask it
   something like *"what's the current time?"* — it should call your tool
   and answer with the real value the tool returned.

### Writing Code blocks

Every node's logic is a Code block: JavaScript that reads a parsed `input`
object and **must `return` a string** (for tools/resources, wrap structured
data with `JSON.stringify(...)`; for prompts, return the assembled prompt
text). `async`/`await` work. **`fetch` and `console` are deliberately not
available** — see [Security](#security) for why. This means Code blocks are
for computation, formatting, and validation, not for calling external APIs
or writing to disk.

See **[docs/examples.md](docs/examples.md)** for worked, verified example
projects — including one exercising typed input properties and all three
MCP primitives together.

## Layout

| Path                      | What it is                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| `packages/config-schema`  | Zod schema + types for a `SynapseProject` (nodes, groups, exposure) |
| `packages/codegen`        | Turns a project into the files of a standalone MCP server           |
| `apps/server`             | Express API: project CRUD, sandboxed node execution, export routes  |
| `apps/web`                | Vite + React workspace UI: canvas, node editor, playground, export  |

## Running it in dev

```bash
npm install                                # from the repo root — npm workspaces
npm run dev --workspace @synapse/server    # terminal 1: API on :4000
npm run dev --workspace @synapse/web       # terminal 2: UI on :5173
```

`dev` runs `tsx watch src/index.ts` for the server, and `vite` for the web
app. The web app's dev server proxies `/api/*` to `http://127.0.0.1:4000`
(see `apps/web/vite.config.ts`), so open `http://localhost:5173` once both
are running.

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

- `npm test` runs the `@synapse/web` and `backend` projects defined in the
  root `vitest.workspace.ts`, both of which exclude `**/*.integration.test.ts`
  so the slow tests stay out of the default loop.
- `npm run test:integration` runs the workspace's `integration` project,
  which runs exactly those excluded files. They generate a server,
  `npm install` it into a temp directory and drive it with a **real MCP
  client over stdio**, so they require network access and take tens of
  seconds.

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
