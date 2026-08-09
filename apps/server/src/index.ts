import { createApp } from "./app.js";
import { ProjectStorage } from "./storage.js";

const dataDir = process.env.SYNAPSE_DATA_DIR ?? "./data";
const app = createApp({ storage: new ProjectStorage(dataDir) });
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// Bind to the loopback interface only. Synapse v1 has no authentication and
// executes user-authored Code blocks with this process's OS privileges, so
// listening on 0.0.0.0 (the default when no host is passed) would expose
// unauthenticated code execution to the whole network.
const host = "127.0.0.1";

app.listen(port, host, () => {
  console.log(`Synapse server listening on http://${host}:${port}`);
});
