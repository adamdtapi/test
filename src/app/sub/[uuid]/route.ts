import { eq } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { buildVlessUrl, getPublicHost, getRelayPath } from "@/lib/links";

export const dynamic = "force-dynamic";

// Subscription endpoint for client apps (v2rayNG, NekoBox, Streisand, …).
// Returns base64-encoded config with quota headers when supported.
export async function GET(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  try {
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.uuid, uuid))
      .limit(1);
    if (!link || !link.enabled) {
      return new Response("not found", { status: 404 });
    }
    const host = getPublicHost(request);
    const url = buildVlessUrl({
      uuid: String(link.uuid),
      name: link.name,
      host,
      path: getRelayPath(),
    });
    const content = Buffer.from(url, "utf8").toString("base64");
    const expire = link.expiresAt ? Math.floor(link.expiresAt.getTime() / 1000) : 0;
    const nameB64 = Buffer.from(link.name, "utf8").toString("base64");
    return new Response(content, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "profile-title": `base64:${nameB64}`,
        "subscription-userinfo": `upload=0; download=${link.usedBytes}; total=${link.quotaBytes}; expire=${expire}`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
