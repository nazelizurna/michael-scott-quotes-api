import { createApp } from "./app.js";

const port = process.env.PORT || 3000;
createApp().listen(port, () => {
  console.log(`Michael Scott Quotes API listening on port ${port}`);
});
