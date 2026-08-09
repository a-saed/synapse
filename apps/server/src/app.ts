import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { synapseProjectSchema } from "@synapse/config-schema";
import { generateServer } from "@synapse/codegen";
import type { ProjectStorage } from "./storage.js";
import { runCode } from "./sandbox/run.js";
import { createZipBuffer, generateClaudeConfigSnippet } from "./export.js";

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;

// Express 4 does not forward errors thrown inside async handlers to its
// error-handling middleware; an unhandled rejection would result instead.
// Wrapping every async route in this helper routes thrown errors (e.g. the
// projectId format validation in ProjectStorage) to `next`, so they hit the
// error handler below and produce a deliberate response instead of a crash.
function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

function isInvalidProjectIdError(err: unknown): err is Error {
  return err instanceof Error && err.message.startsWith("Invalid projectId");
}

export function createApp({ storage }: { storage: ProjectStorage }): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post(
    "/projects",
    asyncHandler(async (req, res) => {
      const parsed = synapseProjectSchema.safeParse({
        nodes: [],
        groups: [],
        exposedGroupIds: [],
        ...req.body,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      await storage.save(parsed.data);
      res.status(201).json(parsed.data);
    })
  );

  app.get(
    "/projects",
    asyncHandler(async (_req, res) => {
      res.json(await storage.list());
    })
  );

  app.get(
    "/projects/:id",
    asyncHandler(async (req, res) => {
      const project = await storage.load(req.params.id);
      if (!project)
        return res.status(404).json({ error: "project not found" });
      res.json(project);
    })
  );

  app.put(
    "/projects/:id",
    asyncHandler(async (req, res) => {
      const parsed = synapseProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      if (parsed.data.id !== req.params.id) {
        return res.status(400).json({ error: "id in body must match URL" });
      }
      await storage.save(parsed.data);
      res.json(parsed.data);
    })
  );

  app.post(
    "/projects/:projectId/nodes/:nodeId/execute",
    asyncHandler(async (req, res) => {
      const project = await storage.load(req.params.projectId);
      if (!project)
        return res.status(404).json({ error: "project not found" });

      const node = project.nodes.find((n) => n.id === req.params.nodeId);
      if (!node) return res.status(404).json({ error: "node not found" });

      const result = await runCode(node.logic.code, req.body.input);
      res.json(result);
    })
  );

  app.get(
    "/projects/:id/export/snippet",
    asyncHandler(async (req, res) => {
      const project = await storage.load(req.params.id);
      if (!project)
        return res.status(404).json({ error: "project not found" });
      const snippet = generateClaudeConfigSnippet(project, `./${project.id}`);
      res.type("application/json").send(snippet);
    })
  );

  app.get(
    "/projects/:id/export/archive",
    asyncHandler(async (req, res) => {
      const project = await storage.load(req.params.id);
      if (!project)
        return res.status(404).json({ error: "project not found" });
      const files = generateServer(project);
      const buffer = await createZipBuffer(files);
      res.type("application/zip").attachment(`${project.id}.zip`).send(buffer);
    })
  );

  // Centralized error handler. Storage methods (save/load/delete) throw a
  // synchronous-shaped "Invalid projectId" error for ids containing path
  // separators or other characters outside [A-Za-z0-9_-]; client-supplied
  // ids (via the request body on POST/PUT, or the URL param on GET/PUT)
  // reach these methods without a prior format check, since
  // synapseProjectSchema only requires a non-empty string. Routing thrown
  // errors here via asyncHandler lets us report those as 400s instead of
  // an opaque/unhandled failure, while anything unexpected still yields an
  // explicit 500 rather than crashing the process.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (isInvalidProjectIdError(err)) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
