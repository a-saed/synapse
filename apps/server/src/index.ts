import { createApp } from "./app.js";

const app = createApp();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`Synapse server listening on port ${port}`);
});
