import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import handler from "../api/index.js";

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(handler).listen(0, resolve);
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

test("search is case-insensitive and handles encoded spaces", async () => {
  const res = await fetch(`${base}/v1/quotes/search/SHE%20SAID`);
  assert.ok((await res.json()).length >= 1);
});

test("CORS header is present", async () => {
  const res = await fetch(`${base}/v1/quotes`);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("schema and health respond", async () => {
  assert.equal((await fetch(`${base}/v1/schema`)).status, 200);
  assert.equal((await fetch(`${base}/health`)).status, 200);
});

test("Vercel-style rewritten URLs (/api?path=...) route correctly", async () => {
  const root = await fetch(`${base}/api?path=`);
  assert.equal((await root.json()).name, "Michael Scott Quotes API");

  const random = await fetch(`${base}/api?path=v1/quotes`);
  assert.equal((await random.json()).length, 1);

  const count = await fetch(`${base}/api?path=v1/quotes/2`);
  assert.equal((await count.json()).length, 2);

  const search = await fetch(`${base}/api?path=v1/quotes/search/she%20said`);
  assert.ok((await search.json()).length >= 1);

  assert.equal((await fetch(`${base}/api?path=health`)).status, 200);
});

test("unknown route returns 404 JSON", async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
});
