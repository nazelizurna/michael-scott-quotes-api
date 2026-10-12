# Michael Scott Quotes API

A small, free, open REST API serving Michael Scott quotes from *The Office* (US).
Modeled on [ron-swanson-quotes](https://github.com/jamesseanwright/ron-swanson-quotes).

All endpoints are `GET`, return JSON, require no authentication, and send
`Access-Control-Allow-Origin: *`.

| Endpoint | Description |
| --- | --- |
| `/v1/quotes` | One random quote |
| `/v1/quotes/:count` | `count` random quotes (1-50) |
| `/v1/quotes/search/:term` | Quotes containing `term` (case-insensitive) |
| `/v1/schema` | OpenAPI 3 schema |
| `/health` | Health check |

```bash
curl michael-scott-quotes-api.vercel.app
# ["That's what she said!"]
```

## Run locally

```bash
npm install
npm start      # http://localhost:3000
npm test
```

## Adding quotes

Edit `data/quotes.js` (a plain array of strings). Only add lines you have
verified against the episode, and keep them short.

## Deploy free on Vercel (Hobby plan)

```bash
npm i -g vercel
vercel login
vercel --prod
```

Or import the GitHub repo at vercel.com/new. No build settings are needed:
`api/index.js` is the serverless entry point and `vercel.json` routes every
path to it.

## Disclaimer

Unofficial fan project, not affiliated with NBC, Universal or the creators of
*The Office*. Quotes remain the property of their respective rights holders.

