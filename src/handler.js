import quotes from "../data/quotes.js";

const MAX_COUNT = 50;

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const openApiSchema = {
  openapi: "3.0.3",
  info: {
    title: "Michael Scott Quotes API",
    version: "1.0.0",
    description: "Quotes from Michael Scott in The Office (US).",
  },
  paths: {
    "/v1/quotes": {
      get: {
        summary: "One random quote",
        responses: { 200: { description: "Array with one quote string" } },
      },
    },
    "/v1/quotes/{count}": {
      get: {
        summary: `Several random quotes (1-${MAX_COUNT})`,
        parameters: [
          {
            name: "count",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: MAX_COUNT },
          },
        ],
        responses: {
          200: { description: "Array of quote strings" },
          400: { description: "Invalid count" },
        },
      },
    },
    "/v1/quotes/search/{term}": {
      get: {
        summary: "Quotes containing a term (case-insensitive)",
        parameters: [
          {
            name: "term",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Array of matching quote strings" } },
      },
    },
  },
};

function pickRandom(list, count) {
  // Fisher-Yates shuffle on a copy, then take the first `count`
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { ...BASE_HEADERS, ...extraHeaders });
  res.end(JSON.stringify(body));
}

// Works as a Vercel serverless function and as a plain Node http handler.
export default function handler(req, res) {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, BASE_HEADERS);
      return res.end();
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const url = new URL(req.url, "http://localhost");
    // On Vercel, vercel.json rewrites every request to /api?path=<original path>
    // so routing doesn't depend on how the platform reports req.url.
    // Locally (and in tests) the real pathname is used.
    const queryPath = url.searchParams.get("path");
    const fromQuery = queryPath !== null;
    const rawPath = fromQuery ? "/" + queryPath : url.pathname;
    const path = rawPath.replace(/\/+$/, "") || "/";
    const noStore = { "Cache-Control": "no-store" };

    if (path === "/") {
      return send(res, 200, {
        name: "Michael Scott Quotes API",
        endpoints: [
          "/v1/quotes",
          "/v1/quotes/:count",
          "/v1/quotes/search/:term",
          "/v1/schema",
        ],
        total_quotes: quotes.length,
      });
    }

    if (path === "/health") return send(res, 200, { status: "ok" });
    if (path === "/v1/schema") return send(res, 200, openApiSchema);

    if (path === "/v1/quotes") {
      return send(res, 200, pickRandom(quotes, 1), noStore);
    }

    const search = path.match(/^\/v1\/quotes\/search\/(.+)$/);
    if (search) {
      let term;
      try {
        // searchParams already decodes; a real pathname still needs decoding
        term = (fromQuery ? search[1] : decodeURIComponent(search[1])).toLowerCase();
      } catch {
        return send(res, 400, { error: "Invalid search term" });
      }
      return send(res, 200, quotes.filter((q) => q.toLowerCase().includes(term)));
    }

    const countMatch = path.match(/^\/v1\/quotes\/([^/]+)$/);
    if (countMatch) {
      const count = Number(countMatch[1]);
      if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
        return send(res, 400, {
          error: `count must be an integer from 1 to ${MAX_COUNT}`,
        });
      }
      return send(
        res,
        200,
        pickRandom(quotes, Math.min(count, quotes.length)),
        noStore
      );
    }

    return send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Internal server error" });
  }
}
