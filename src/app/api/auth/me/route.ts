import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, username: user.username });
}
