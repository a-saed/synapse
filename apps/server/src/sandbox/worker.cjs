const { parentPort, workerData } = require("node:worker_threads");
const vm = require("node:vm");

async function main() {
  const context = vm.createContext({
    input: workerData.input,
    console,
    Promise,
    JSON,
    fetch,
  });
  const script = new vm.Script(
    `(async function () {\n${workerData.code}\n})()`,
    { filename: "code-block.js" }
  );
  const result = await script.runInContext(context);
  if (typeof result !== "string") {
    throw new Error(`Code block must return a string, got ${typeof result}`);
  }
  return result;
}

main()
  .then((result) => parentPort.postMessage({ ok: true, result }))
  .catch((err) =>
    parentPort.postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  );
