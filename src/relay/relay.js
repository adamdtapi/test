"use strict";

// ─────────────────────────────────────────────────────────────
//  Gateway relay — WebSocket entrypoint for VLESS-compatible
//  streams. Attaches to the same HTTP server as the panel, so
//  the whole service runs as a single process / single port.
//
//  Link inventory and quota persistence are owned by the Next.js
//  app; the relay syncs through /internal/* endpoints with a
//  shared secret (same process, same env var).
// ─────────────────────────────────────────────────────────────

const net = require("net");
const { WebSocketServer } = require("ws");
const { parseHeader, RESPONSE_OK } = require("./vless");
const relayState = require("./state");

const SYNC_INTERVAL_MS = 5_000;
const LINK_REFRESH_MS = 15_000;
const MAX_BUFFER_BYTES = 512 * 1024;
const CONNECT_TIMEOUT_MS = 15_000;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function attachRelay(httpServer, options) {
  const { path, port, internalSecret } = options;
  const base = `http://127.0.0.1:${port}`;
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_BUFFER_BYTES });

  // Only the relay path is a WebSocket endpoint. Everything else is
  // handled by Next.js; upgrades for other paths are rejected.
  httpServer.on("upgrade", (req, socket, head) => {
    let pathname;
    try {
      pathname = new URL(req.url, "http://localhost").pathname;
    } catch {
      socket.destroy();
      return;
    }
    if (pathname !== path) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    relayState.connectionOpened();
    handleConnection(ws);
  });

  async function internalFetch(urlPath, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const res = await fetch(`${base}${urlPath}`, {
        ...init,
        signal: controller.signal,
        headers: {
          "x-internal-secret": internalSecret,
          "content-type": "application/json",
          ...(init.headers || {}),
        },
      });
      if (!res.ok) {
        throw new Error(`internal ${urlPath} -> ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function syncLinks() {
    try {
      const data = await internalFetch("/internal/links");
      if (data && Array.isArray(data.links)) {
        relayState.setLinks(data.links);
        relayState.state.lastSyncError = null;
      }
    } catch (err) {
      relayState.state.lastSyncError = String(err && err.message ? err.message : err);
    }
  }

  let lastFlush = 0;

  async function flushTraffic() {
    const deltas = relayState.flushDeltas();
    const now = Date.now();
    // Keep a heartbeat even when idle so the panel can show the relay is alive.
    if (deltas.length === 0 && lastFlush && now - lastFlush < 20_000) {
      return;
    }
    lastFlush = now;
    try {
      const data = await internalFetch("/internal/traffic", {
        method: "POST",
        body: JSON.stringify({
          at: nowSeconds(),
          upSince: Math.floor(relayState.state.startedAt / 1000),
          activeConnections: relayState.state.activeConnections,
          totalConnections: relayState.state.totalConnections,
          deltas,
        }),
      });
      if (data && data.ok) {
        // Authoritative usedBytes from the database
        if (data.used && typeof data.used === "object") {
          for (const [uuid, used] of Object.entries(data.used)) {
            const link = relayState.state.links.get(uuid.toLowerCase());
            if (link) link.usedBytes = Number(used) || 0;
          }
        }
        relayState.state.lastSyncError = null;
      }
    } catch (err) {
      // keep deltas for the next round? flushDeltas already zeroed them;
      // a failed flush simply loses that slice — acceptable for stats.
      relayState.state.lastSyncError = String(err && err.message ? err.message : err);
    }
  }

  // Bootstrap + periodic sync
  syncLinks();
  setInterval(syncLinks, LINK_REFRESH_MS).unref();
  setInterval(flushTraffic, SYNC_INTERVAL_MS).unref();

  return { wss, syncLinks, flushTraffic, internalFetch };
}

function handleConnection(ws) {
  let uuid = null;
  let target = null;
  let closed = false;
  let established = false;
  let firstChunk = [];
  let firstChunkSize = 0;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    relayState.connectionClosed();
    try { ws.removeAllListeners(); } catch {}
    try { ws.close(); } catch {}
    try { ws.terminate(); } catch {}
    if (target) {
      try { target.removeAllListeners(); } catch {}
      try { target.destroy(); } catch {}
      target = null;
    }
  };

  ws.on("message", (data, isBinary) => {
    try {
      if (!established) {
        // Buffer until we have a full VLESS header
        if (!Buffer.isBuffer(data)) data = Buffer.from(data);
        firstChunk.push(data);
        firstChunkSize += data.length;
        if (firstChunkSize > 8192) {
          cleanup();
          return;
        }
        if (firstChunkSize < 19) return;

        const buf = Buffer.concat(firstChunk);
        firstChunk = [];
        firstChunkSize = 0;

        const header = parseHeader(buf);
        if (!header || !relayState.isUsable(header.uuid)) {
          // Rejected connections are closed silently (standard behavior).
          cleanup();
          return;
        }
        uuid = header.uuid;

        if (header.command !== 0x01) {
          // Only TCP streams are supported in this build.
          cleanup();
          return;
        }

        const remainingPayload = buf.slice(header.headerLen);
        established = true;

        target = net.connect(header.port, header.address);
        target.setTimeout(CONNECT_TIMEOUT_MS);
        target.once("connect", () => {
          if (closed) return;
          target.setTimeout(0);
          target.setNoDelay(true);
          target.setKeepAlive(true, 30_000);
          try { ws.send(RESPONSE_OK); } catch { cleanup(); return; }
          if (remainingPayload.length > 0) {
            relayState.addTraffic(uuid, remainingPayload.length, 0);
            if (!target.write(remainingPayload)) {
              ws.pause?.();
            }
          }
        });

        target.on("data", (chunk) => {
          if (closed) return;
          relayState.addTraffic(uuid, 0, chunk.length);
          if (relayState.remaining(uuid) <= 0) {
            cleanup();
            return;
          }
          if (ws.bufferedAmount > MAX_BUFFER_BYTES) {
            target.pause();
            const drain = () => {
              if (ws.bufferedAmount <= MAX_BUFFER_BYTES / 2) {
                try { target.resume(); } catch {}
                ws.off("drain", drain);
              }
            };
            ws.on("drain", drain);
          }
          try {
            ws.send(chunk, { binary: true }, (err) => {
              if (err) cleanup();
            });
          } catch {
            cleanup();
          }
        });

        target.on("drain", () => {
          try { ws.resume?.(); } catch {}
        });

        target.on("error", () => cleanup());
        target.on("close", () => cleanup());
        target.on("timeout", () => cleanup());
        return;
      }

      // Established tunnel: client -> target
      if (!target || target.destroyed) return;
      const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
      relayState.addTraffic(uuid, chunk.length, 0);
      if (relayState.remaining(uuid) <= 0) {
        cleanup();
        return;
      }
      if (!target.write(chunk)) {
        ws.pause?.();
      }
    } catch {
      cleanup();
    }
  });

  ws.on("drain", () => {
    try { target?.resume(); } catch {}
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);

  // Safety: drop idle handshakes
  setTimeout(() => {
    if (!established && !closed) cleanup();
  }, 10_000).unref();
}

module.exports = { attachRelay };
