// Link / subscription URL builders shared by API routes and UI.

export function getRelayPath(): string {
  return process.env.RELAY_PATH || "/api/v1/ws";
}

export function getPublicHost(request?: Request): string {
  const raw =
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    (request ? request.headers.get("host") || "" : "") ||
    "localhost";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "").split(",")[0].trim();
}

export function buildVlessUrl(opts: {
  uuid: string;
  name: string;
  host: string;
  path?: string;
  tls?: boolean;
}): string {
  const path = opts.path || getRelayPath();
  const tls = opts.tls !== false;
  const params = new URLSearchParams({
    encryption: "none",
    security: tls ? "tls" : "none",
    type: "ws",
    host: opts.host,
    path,
  });
  if (tls) {
    params.set("sni", opts.host);
    params.set("fp", "chrome");
    params.set("alpn", "http/1.1");
  }
  return `vless://${opts.uuid}@${opts.host}:${tls ? 443 : 80}?${params.toString()}#${encodeURIComponent(opts.name || "api-link")}`;
}

export function buildSubscriptionUrl(uuid: string, host: string): string {
  return `https://${host}/sub/${uuid}`;
}
