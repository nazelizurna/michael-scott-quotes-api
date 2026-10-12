import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import quotes from "../data/quotes.js";

const MAX_COUNT = 50;

function pickRandom(list, count) {
  // Fisher-Yates shuffle on a copy, then take the first `count`
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

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

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // hosts like Render/Vercel sit behind a proxy
  app.use(cors()); // Access-Control-Allow-Origin: *
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/", (_req, res) => {
    res.json({
      name: "Michael Scott Quotes API",
      endpoints: [
        "/v1/quotes",
        "/v1/quotes/:count",
        "/v1/quotes/search/:term",
        "/v1/schema",
      ],
      total_quotes: quotes.length,
    });
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/v1/quotes", (_req, res) => {
    res.json(pickRandom(quotes, 1));
  });

  app.get("/v1/quotes/search/:term", (req, res) => {
    const term = req.params.term.toLowerCase();
    res.json(quotes.filter((q) => q.toLowerCase().includes(term)));
  });

  app.get("/v1/quotes/:count", (req, res) => {
    const count = Number(req.params.count);
    if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
      return res
        .status(400)
        .json({ error: `count must be an integer from 1 to ${MAX_COUNT}` });
    }
    res.json(pickRandom(quotes, Math.min(count, quotes.length)));
  });

  app.get("/v1/schema", (_req, res) => res.json(openApiSchema));

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  return app;
}
