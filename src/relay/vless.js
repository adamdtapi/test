"use strict";

// ─────────────────────────────────────────────────────────────
//  Minimal VLESS protocol helpers (RFC-style inbound).
//  Header layout after the WebSocket is established:
//    1 byte  version (0x00)
//   16 bytes UUID
//    1 byte  addon length M, M bytes addons
//    1 byte  command (1=TCP, 2=UDP, 3=MUX)
//    2 bytes port (big endian)
//    1 byte  atyp (1=IPv4, 2=domain, 3=IPv6)
//    N bytes address
//    ...     payload
// ─────────────────────────────────────────────────────────────

function parseHeader(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 19) return null;
  if (buf[0] !== 0x00) return null;

  const hex = buf.slice(1, 17).toString("hex");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase();

  let pos = 17;
  const addonLen = buf[pos];
  pos += 1 + addonLen;
  if (buf.length < pos + 4) return null;

  const command = buf[pos];
  pos += 1;
  const port = buf.readUInt16BE(pos);
  pos += 2;
  const atyp = buf[pos];
  pos += 1;

  let address;
  if (atyp === 0x01) {
    if (buf.length < pos + 4) return null;
    address = `${buf[pos]}.${buf[pos + 1]}.${buf[pos + 2]}.${buf[pos + 3]}`;
    pos += 4;
  } else if (atyp === 0x02) {
    const len = buf[pos];
    pos += 1;
    if (buf.length < pos + len) return null;
    address = buf.slice(pos, pos + len).toString("utf8");
    pos += len;
  } else if (atyp === 0x03) {
    if (buf.length < pos + 16) return null;
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push(buf.slice(pos + i, pos + i + 2).toString("hex"));
    }
    address = parts.join(":");
    pos += 16;
  } else {
    return null;
  }

  return { version: 0, uuid, command, port, atyp, address, headerLen: pos };
}

// VLESS success response: version byte + zero addon length.
const RESPONSE_OK = Buffer.from([0x00, 0x00]);

module.exports = { parseHeader, RESPONSE_OK };
