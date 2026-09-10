import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!username || !password) {
      return Response.json(
        { ok: false, error: "نام کاربری و رمز عبور الزامی است" },
        { status: 400 },
      );
    }
    await ensureSeed();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json(
        { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" },
        { status: 401 },
      );
    }
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return Response.json({ ok: true, username: user.username });
  } catch {
    return Response.json({ ok: false, error: "خطای داخلی سرور" }, { status: 500 });
  }
}
