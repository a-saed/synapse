import { Worker } from "node:worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, "worker.cjs");

export interface SandboxResult {
  ok: boolean;
  result?: string;
  error?: string;
}

export function runCode(
  code: string,
  input: unknown,
  timeoutMs = 5000
): Promise<SandboxResult> {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_PATH, { workerData: { code, input } });

    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, error: `Execution timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    worker.once("message", (msg: SandboxResult) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(msg);
    });

    worker.once("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message });
    });
  });
}
