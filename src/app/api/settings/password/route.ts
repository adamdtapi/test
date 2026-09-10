import { cookies } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const current = String(body?.current || "");
  const nextPassword = String(body?.next || "");

  if (nextPassword.length < 6) {
    return Response.json(
      { ok: false, error: "رمز جدید باید حداقل ۶ کاراکتر باشد" },
      { status: 400 },
    );
  }
  if (!verifyPassword(current, user.passwordHash)) {
    return Response.json({ ok: false, error: "رمز فعلی اشتباه است" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(nextPassword) })
    .where(eq(users.id, user.id));

  // Invalidate all other sessions
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (currentToken) {
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), ne(sessions.id, currentToken)));
  }

  return Response.json({ ok: true });
}
