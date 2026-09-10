"use strict";

// ─────────────────────────────────────────────────────────────
//  API Gateway — production entrypoint.
//  A single HTTP server that serves:
//    - the management panel (Next.js)
//    - the gateway relay (WebSocket upgrade on RELAY_PATH)
//    - the internal sync endpoints used by the relay
//  Railway / any Node host runs: `npm start` -> `node server.js`
// ─────────────────────────────────────────────────────────────

const { createServer } = require("http");
const crypto = require("crypto");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const relayPath = process.env.RELAY_PATH || "/api/v1/ws";

// Shared secret for relay <-> panel internal endpoints.
// In the same process this is generated once and shared through env.
if (!process.env.INTERNAL_SECRET) {
  process.env.INTERNAL_SECRET = crypto.randomBytes(24).toString("hex");
}

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Fast path for internal pings (avoids Next overhead)
    if (req.url === "/_relay/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, relay: "running", path: relayPath }));
      return;
    }
    handle(req, res);
  });

  if (process.env.RELAY_ENABLED !== "false") {
    const { attachRelay } = require("./src/relay/relay");
    attachRelay(server, {
      path: relayPath,
      port,
      internalSecret: process.env.INTERNAL_SECRET,
    });
    console.log(`[relay] websocket entrypoint: ${relayPath}`);
  }

  server.listen(port, () => {
    console.log(`[api] panel + gateway listening on :${port} (${dev ? "dev" : "prod"})`);
  });
});
