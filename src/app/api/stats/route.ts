import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { links, traffic } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getRelayStats } from "@/lib/relayStats";

export const dynamic = "force-dynamic";

type Point = { t: string; in: number; out: number };

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const range = url.searchParams.get("range") === "24h" ? "24h" : url.searchParams.get("range") === "1h" ? "1h" : "10m";

  const [agg] = await db
    .select({
      totalLinks: sql<number>`count(*)::int`,
      activeLinks: sql<number>`count(*) filter (where ${links.enabled})::int`,
      totalUsed: sql<number>`coalesce(sum(${links.usedBytes}), 0)::bigint`,
    })
    .from(links);

  const top = await db
    .select()
    .from(links)
    .orderBy(desc(links.usedBytes))
    .limit(6);

  let points: Point[] = [];
  if (range === "10m") {
    const since = new Date(Math.floor(Date.now() / 10000) * 10000 - 10 * 60_000);
    const rows = await db
      .select({
        bucket: traffic.bucketStart,
        bytesIn: sql<number>`coalesce(sum(${traffic.bytesIn}), 0)::bigint`,
        bytesOut: sql<number>`coalesce(sum(${traffic.bytesOut}), 0)::bigint`,
      })
      .from(traffic)
      .where(gte(traffic.bucketStart, since))
      .groupBy(traffic.bucketStart)
      .orderBy(traffic.bucketStart);
    points = rows.map((r) => ({
      t: new Date(r.bucket).toISOString(),
      in: Number(r.bytesIn),
      out: Number(r.bytesOut),
    }));
  } else {
    const trunc = range === "1h" ? "minute" : "hour";
    const since = new Date(Date.now() - (range === "1h" ? 3_600_000 : 24 * 3_600_000));
    const rows = await db
      .select({
        bucket: sql<string>`date_trunc(${trunc}, ${traffic.bucketStart})`,
        bytesIn: sql<number>`coalesce(sum(${traffic.bytesIn}), 0)::bigint`,
        bytesOut: sql<number>`coalesce(sum(${traffic.bytesOut}), 0)::bigint`,
      })
      .from(traffic)
      .where(gte(traffic.bucketStart, since))
      .groupBy(sql`date_trunc(${trunc}, ${traffic.bucketStart})`)
      .orderBy(sql`1`);
    points = rows.map((r) => ({
      t: new Date(r.bucket).toISOString(),
      in: Number(r.bytesIn),
      out: Number(r.bytesOut),
    }));
  }

  return Response.json({
    ok: true,
    totals: {
      totalLinks: Number(agg?.totalLinks ?? 0),
      activeLinks: Number(agg?.activeLinks ?? 0),
      totalUsed: Number(agg?.totalUsed ?? 0),
    },
    top,
    points,
    relay: getRelayStats(),
    range,
  });
}
