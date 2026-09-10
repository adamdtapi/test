"use strict";

// ─────────────────────────────────────────────────────────────
//  In-memory state for the gateway relay.
//  The relay process and the Next.js process are the same Node
//  process (custom server), so this module is the single source
//  of truth for live counters. Counters are flushed to Postgres
//  by the sync loop through the internal API.
// ─────────────────────────────────────────────────────────────

const state = {
  startedAt: Date.now(),
  activeConnections: 0,
  totalConnections: 0,
  // uuid -> link snapshot: { quotaBytes, usedBytes, enabled, expiresAt }
  links: new Map(),
  // uuid -> deltas since last flush: { bytesIn, bytesOut, active }
  counters: new Map(),
  lastSync: 0,
  lastSyncError: null,
};

function counter(uuid) {
  let c = state.counters.get(uuid);
  if (!c) {
    c = { bytesIn: 0, bytesOut: 0 };
    state.counters.set(uuid, c);
  }
  return c;
}

function addTraffic(uuid, bytesIn, bytesOut) {
  const c = counter(uuid);
  c.bytesIn += bytesIn;
  c.bytesOut += bytesOut;
}

function connectionOpened() {
  state.activeConnections += 1;
  state.totalConnections += 1;
}

function connectionClosed() {
  state.activeConnections = Math.max(0, state.activeConnections - 1);
}

function setLinks(linkList) {
  state.links.clear();
  for (const l of linkList || []) {
    state.links.set(String(l.uuid).toLowerCase(), {
      quotaBytes: Number(l.quotaBytes) || 0,
      usedBytes: Number(l.usedBytes) || 0,
      enabled: !!l.enabled,
      expiresAt: l.expiresAt ? new Date(l.expiresAt).getTime() : 0,
    });
  }
  state.lastSync = Date.now();
}

function normalizeUuid(uuid) {
  if (uuid.includes("-")) return uuid.toLowerCase();
  const h = uuid.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (h.length !== 32) return null;
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function isUsable(uuid) {
  const l = state.links.get(normalizeUuid(uuid) || "");
  if (!l || !l.enabled) return false;
  if (l.expiresAt && Date.now() > l.expiresAt) return false;
  const c = state.counters.get(normalizeUuid(uuid) || "");
  const extra = c ? c.bytesIn + c.bytesOut : 0;
  if (l.quotaBytes > 0 && l.usedBytes + extra >= l.quotaBytes) return false;
  return true;
}

function remaining(uuid) {
  const n = normalizeUuid(uuid);
  const l = state.links.get(n || "");
  if (!l) return 0;
  if (l.quotaBytes === 0) return Number.POSITIVE_INFINITY;
  const c = state.counters.get(n || "");
  const extra = c ? c.bytesIn + c.bytesOut : 0;
  return Math.max(0, l.quotaBytes - (l.usedBytes + extra));
}

// Collect deltas since last flush and zero them out.
function flushDeltas() {
  const deltas = [];
  for (const [uuid, c] of state.counters) {
    if (c.bytesIn > 0 || c.bytesOut > 0) {
      deltas.push({ uuid, bytesIn: c.bytesIn, bytesOut: c.bytesOut });
      c.bytesIn = 0;
      c.bytesOut = 0;
    }
  }
  return deltas;
}

function getSnapshot() {
  return {
    startedAt: state.startedAt,
    activeConnections: state.activeConnections,
    totalConnections: state.totalConnections,
    lastSync: state.lastSync,
    lastSyncError: state.lastSyncError,
    links: state.links.size,
  };
}

module.exports = {
  state,
  addTraffic,
  connectionOpened,
  connectionClosed,
  setLinks,
  isUsable,
  remaining,
  normalizeUuid,
  flushDeltas,
  getSnapshot,
};
