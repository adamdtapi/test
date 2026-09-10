import { desc } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { buildSubscriptionUrl, buildVlessUrl, getPublicHost, getRelayPath } from "@/lib/links";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const rows = await db.select().from(links).orderBy(desc(links.createdAt));
  const host = getPublicHost(request);
  const path = getRelayPath();
  const items = rows.map((l) => ({
    ...l,
    url: buildVlessUrl({ uuid: String(l.uuid), name: l.name, host, path }),
    subUrl: buildSubscriptionUrl(String(l.uuid), host),
  }));
  return Response.json({ ok: true, links: items, host, path });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  if (!name) {
    return Response.json({ ok: false, error: "نام لینک الزامی است" }, { status: 400 });
  }
  if (name.length > 64) {
    return Response.json({ ok: false, error: "نام لینک حداکثر ۶۴ کاراکتر است" }, { status: 400 });
  }

  const quotaGb = Number(body?.quotaGb);
  const quotaBytes =
    Number.isFinite(quotaGb) && quotaGb > 0 ? Math.round(quotaGb * 1024 * 1024 * 1024) : 0;

  const expireDays = Number(body?.expireDays);
  const expiresAt =
    Number.isFinite(expireDays) && expireDays > 0
      ? new Date(Date.now() + Math.round(expireDays) * 86_400_000)
      : null;

  const [link] = await db
    .insert(links)
    .values({ name, quotaBytes, expiresAt })
    .returning();

  const host = getPublicHost(request);
  return Response.json({
    ok: true,
    link: {
      ...link,
      url: buildVlessUrl({ uuid: String(link.uuid), name: link.name, host }),
      subUrl: buildSubscriptionUrl(String(link.uuid), host),
    },
  });
}
