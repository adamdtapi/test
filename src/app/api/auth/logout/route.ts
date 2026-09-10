import { cookies } from "next/headers";
import { SESSION_COOKIE, destroySession, clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  await clearSessionCookie();
  return Response.json({ ok: true });
}
