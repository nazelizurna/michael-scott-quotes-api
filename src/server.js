import http from "node:http";
import handler from "./handler.js";

const port = process.env.PORT || 3000;
http.createServer(handler).listen(port, () => {
  console.log(`Michael Scott Quotes API listening on port ${port}`);
});
