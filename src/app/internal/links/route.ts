import { desc } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";

export const dynamic = "force-dynamic";

// Internal endpoint consumed by the in-process relay (shared secret).
export async function GET(request: Request) {
  if (process.env.INTERNAL_SECRET !== request.headers.get("x-internal-secret")) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const rows = await db
    .select({
      uuid: links.uuid,
      quotaBytes: links.quotaBytes,
      usedBytes: links.usedBytes,
      enabled: links.enabled,
      expiresAt: links.expiresAt,
    })
    .from(links)
    .orderBy(desc(links.createdAt));
  return Response.json({ ok: true, links: rows });
}
