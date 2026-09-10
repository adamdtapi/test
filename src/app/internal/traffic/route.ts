import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { links, traffic } from "@/db/schema";
import { recordRelayReport } from "@/lib/relayStats";

export const dynamic = "force-dynamic";

type Delta = { uuid?: string; bytesIn?: number; bytesOut?: number };

// Internal endpoint consumed by the in-process relay (shared secret).
export async function POST(request: Request) {
  if (process.env.INTERNAL_SECRET !== request.headers.get("x-internal-secret")) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const deltas: Delta[] = Array.isArray(body?.deltas) ? body.deltas : [];
  const at = Number(body?.at) > 0 ? new Date(Number(body.at) * 1000) : new Date();
  const bucketStart = new Date(Math.floor(at.getTime() / 10000) * 10000);

  const used: Record<string, number> = {};

  if (deltas.length > 0) {
    const uuids = deltas
      .map((d) => String(d.uuid || "").toLowerCase())
      .filter(Boolean);
    const linkRows = await db
      .select({ id: links.id, uuid: links.uuid })
      .from(links)
      .where(inArray(links.uuid, uuids));
    const uuidToId = new Map(linkRows.map((l) => [String(l.uuid), l.id]));

    for (const d of deltas) {
      const uuid = String(d.uuid || "").toLowerCase();
      const linkId = uuidToId.get(uuid);
      if (!linkId) continue;
      const bytesIn = Math.max(0, Math.round(Number(d.bytesIn) || 0));
      const bytesOut = Math.max(0, Math.round(Number(d.bytesOut) || 0));
      if (bytesIn === 0 && bytesOut === 0) continue;

      await db
        .update(links)
        .set({
          usedBytes: sql`${links.usedBytes} + ${bytesIn + bytesOut}`,
          lastSeenAt: at,
        })
        .where(eq(links.id, linkId));

      await db
        .insert(traffic)
        .values({ linkId, bucketStart, bytesIn, bytesOut })
        .onConflictDoUpdate({
          target: [traffic.linkId, traffic.bucketStart],
          set: {
            bytesIn: sql`${traffic.bytesIn} + ${bytesIn}`,
            bytesOut: sql`${traffic.bytesOut} + ${bytesOut}`,
          },
        });
    }

    const updated = await db
      .select({ uuid: links.uuid, usedBytes: links.usedBytes })
      .from(links)
      .where(inArray(links.id, [...uuidToId.values()]));
    for (const u of updated) used[String(u.uuid)] = Number(u.usedBytes);
  }

  recordRelayReport({
    active: Math.max(0, Number(body?.activeConnections) || 0),
    total: Math.max(0, Number(body?.totalConnections) || 0),
    upSince: Number(body?.upSince) > 0 ? Number(body.upSince) * 1000 : 0,
    lastReport: Date.now(),
  });

  return Response.json({ ok: true, used });
}
