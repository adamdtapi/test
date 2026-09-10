import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getRelayStats } from "@/lib/relayStats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    const relay = getRelayStats();
    const running = relay.lastReport > 0 && Date.now() - relay.lastReport < 30_000;
    return Response.json({
      ok: true,
      service: "api",
      relay: running ? "running" : "standby",
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
