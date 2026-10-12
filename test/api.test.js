import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("random quote returns array of one string", async () => {
  const res = await fetch(`${base}/v1/quotes`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.length, 1);
  assert.equal(typeof body[0], "string");
});

test("count returns requested number (capped by dataset size)", async () => {
  const res = await fetch(`${base}/v1/quotes/2`);
  assert.equal((await res.json()).length, 2);
});

test("invalid count returns 400", async () => {
  const res = await fetch(`${base}/v1/quotes/abc`);
  assert.equal(res.status, 400);
});

test("search is case-insensitive", async () => {
  const res = await fetch(`${base}/v1/quotes/search/SHE SAID`);
  assert.ok((await res.json()).length >= 1);
});

test("CORS header is present", async () => {
  const res = await fetch(`${base}/v1/quotes`);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("unknown route returns 404 JSON", async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
});
