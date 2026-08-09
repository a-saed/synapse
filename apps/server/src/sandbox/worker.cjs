const { parentPort, workerData } = require("node:worker_threads");
const vm = require("node:vm");

// SECURITY NOTE — READ BEFORE CHANGING THIS FILE.
//
// Node's `vm` module is NOT a security boundary against a determined
// attacker. It isolates *evaluated code* from the surrounding lexical
// scope; it does NOT isolate the *objects you hand it*. Any host-realm
// object reachable from the context (including the contextified sandbox
// object's own prototype) leads straight back to the host realm's
// `Function` constructor via `X.constructor.constructor`, and from there
// to `process`, `require`, the filesystem and the environment.
//
// What this sandbox actually buys us:
//   * process/memory hygiene — code runs on a worker thread, so a crash,
//     a thrown error or a runaway allocation does not take down the main
//     Express server;
//   * timeout enforcement — `run.ts` calls `worker.terminate()` when the
//     deadline passes, which kills even a synchronous infinite loop.
// That is all it buys us. It is not a defence against malicious code.
// Code blocks must be treated as trusted input (see the root README).
//
// Given that, the context below is built to remove the *known, trivial*
// escape hatches rather than to claim real containment:
//   * the sandbox object is `Object.create(null)`, so `globalThis` and
//     `this` inside the context have no prototype chain reaching the host
//     realm's `Object`/`Function` (a plain `{}` sandbox does, and escapes);
//   * NO host object is passed in. `input` is handed over as a JSON
//     *string primitive* (primitives belong to no realm) and re-parsed by
//     the context's own `JSON`, so the object the code sees is built
//     inside the vm realm;
//   * `console` and `fetch` are deliberately not provided. Per the v1
//     spec a Code block only computes and returns a string. `JSON`,
//     `Promise`, `Math`, `Object`, ... are still available because
//     `vm.createContext` seeds every context with its own realm-local
//     primordials — those are safe, they are not host references.
const INPUT_JSON_KEY = "__synapseInputJson";

function contextualizeInput(context, input) {
  let inputJson;
  try {
    inputJson = JSON.stringify(input);
  } catch {
    throw new Error("Code block input could not be serialized to JSON");
  }
  // A string primitive (or undefined) — never a host-realm object.
  context[INPUT_JSON_KEY] = inputJson;
  vm.runInContext(
    `globalThis.input = globalThis.${INPUT_JSON_KEY} === undefined
      ? undefined
      : JSON.parse(globalThis.${INPUT_JSON_KEY});
     delete globalThis.${INPUT_JSON_KEY};`,
    context,
    { filename: "sandbox-bootstrap.js" }
  );
  delete context[INPUT_JSON_KEY];
}

async function main() {
  const context = vm.createContext(Object.create(null));
  contextualizeInput(context, workerData.input);

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
