import { eq } from "drizzle-orm";
import { db } from "@/db";
import { links, traffic } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const linkId = Number(id);
  if (!Number.isInteger(linkId)) {
    return Response.json({ ok: false, error: "شناسه نامعتبر است" }, { status: 400 });
  }

  await db.update(links).set({ usedBytes: 0 }).where(eq(links.id, linkId));
  await db.delete(traffic).where(eq(traffic.linkId, linkId));
  return Response.json({ ok: true });
}
