import { createApp } from "./app.js";
import { ProjectStorage } from "./storage.js";

const dataDir = process.env.SYNAPSE_DATA_DIR ?? "./data";
const app = createApp({ storage: new ProjectStorage(dataDir) });
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Synapse server listening on port ${port}`);
});
