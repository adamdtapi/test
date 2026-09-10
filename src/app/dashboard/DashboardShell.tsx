"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Globe,
  LayoutDashboard,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "بررسی کلی", icon: LayoutDashboard },
  { href: "/dashboard/links", label: "لینک‌ها", icon: Link2 },
  { href: "/dashboard/settings", label: "تنظیمات", icon: Settings },
];

export function DashboardShell({ children, username }: { children: ReactNode; username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-[#052e22]">
          <Globe size={20} strokeWidth={2.4} />
        </div>
        <div>
          <div className="text-sm font-extrabold tracking-tight">API Gateway</div>
          <div className="text-[11px] text-[var(--muted)]">پنل مدیریت v2.0</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-l from-emerald-400/15 to-cyan-400/5 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5">
          <span className="status-dot live" />
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <Activity size={12} className="text-emerald-400" />
            هسته در حال اجرا
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <span className="truncate text-xs font-medium text-[var(--muted)]">{username}</span>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            title="خروج از حساب"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-red-400/10 hover:text-red-400"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-white/5 bg-[#0d1320]/90 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 border-l border-white/10 bg-[#0d1320] shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute left-4 top-5 text-[var(--muted)] hover:text-white"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pr-64">
        {/* Mobile topbar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#0b0f17]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="btn btn-ghost !px-2.5 !py-2">
            <Menu size={17} />
          </button>
          <span className="text-sm font-bold">API Gateway</span>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-red-400/10 hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
