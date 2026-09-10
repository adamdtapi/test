import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

async function authorize() {
  const user = await getCurrentUser();
  if (!user) return { user: null };
  return { user };
}

export async function PATCH(request: Request, { params }: RouteCtx) {
  const { user } = await authorize();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const linkId = Number(id);
  if (!Number.isInteger(linkId)) {
    return Response.json({ ok: false, error: "شناسه نامعتبر است" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);
  if (!existing) {
    return Response.json({ ok: false, error: "لینک یافت نشد" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const updates: Partial<typeof existing> = {};

  if (typeof body?.name === "string" && body.name.trim()) {
    updates.name = body.name.trim().slice(0, 64);
  }
  if (typeof body?.enabled === "boolean") {
    updates.enabled = body.enabled;
  }
  if (body?.quotaGb !== undefined) {
    const quotaGb = Number(body.quotaGb);
    updates.quotaBytes =
      Number.isFinite(quotaGb) && quotaGb > 0
        ? Math.round(quotaGb * 1024 * 1024 * 1024)
        : 0;
  }
  if (body?.expireDays !== undefined) {
    if (body.expireDays === null || body.expireDays === "") {
      updates.expiresAt = null;
    } else {
      const expireDays = Number(body.expireDays);
      updates.expiresAt =
        Number.isFinite(expireDays) && expireDays > 0
          ? new Date(Date.now() + Math.round(expireDays) * 86_400_000)
          : null;
    }
  }

  const [updated] = await db
    .update(links)
    .set(updates)
    .where(eq(links.id, linkId))
    .returning();

  return Response.json({ ok: true, link: updated });
}

export async function DELETE(_request: Request, { params }: RouteCtx) {
  const { user } = await authorize();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const linkId = Number(id);
  if (!Number.isInteger(linkId)) {
    return Response.json({ ok: false, error: "شناسه نامعتبر است" }, { status: 400 });
  }
  await db.delete(links).where(eq(links.id, linkId));
  return Response.json({ ok: true });
}
