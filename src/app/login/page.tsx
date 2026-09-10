"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "ورود ناموفق بود");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-[#052e22]">
              <Globe size={19} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">API Gateway</div>
              <div className="text-[11px] text-[var(--muted)]">پنل مدیریت درگاه یکپارچه</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="card fade-up w-full max-w-sm p-8">
          <h1 className="text-xl font-extrabold tracking-tight">ورود به پنل</h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            برای دسترسی به داشبورد وارد شوید.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">نام کاربری</span>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  className="input pr-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  dir="ltr"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">رمز عبور</span>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  className="input pr-9"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !password} className="btn btn-primary w-full py-2.5">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
              ورود
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
