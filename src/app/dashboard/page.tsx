"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Gauge,
  Link2,
  Wifi,
  Zap,
} from "lucide-react";
import { TrafficChart, type ChartPoint } from "@/components/Chart";
import { formatBytes, remainingLabel, usagePercent } from "@/lib/format";

type Range = "10m" | "1h" | "24h";

type Stats = {
  totals: { totalLinks: number; activeLinks: number; totalUsed: number };
  points: ChartPoint[];
  top: Array<{
    id: number;
    name: string;
    usedBytes: number;
    quotaBytes: number;
    enabled: boolean;
  }>;
  relay: { active: number; total: number; lastReport: number };
};

const rangeLabels: Record<Range, string> = {
  "10m": "۱۰ دقیقه",
  "1h": "۱ ساعت",
  "24h": "۲۴ ساعت",
};

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<Range>("10m");
  const [error, setError] = useState(false);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?range=${rangeRef.current}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Stats & { ok: boolean };
      if (data.ok) {
        setStats(data);
        setError(false);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const relayLive = stats ? stats.relay.lastReport > 0 && Date.now() - stats.relay.lastReport < 30_000 : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">بررسی کلی</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">نمای زندهٔ وضعیت درگاه و مصرف ترافیک</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge border-white/10 text-[var(--muted)]">
            <span className={`status-dot ${relayLive ? "live" : "idle"}`} />
            {relayLive ? "هسته متصل" : "در انتظار هسته"}
          </span>
          <span className="badge border-white/10 text-[var(--muted)] tabular">
            <Activity size={12} className="text-emerald-400" />
            بروزرسانی ۵ ثانیه
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={Link2}
          label="کل لینک‌ها"
          value={stats ? String(stats.totals.totalLinks) : "—"}
          hint={`${stats?.totals.activeLinks ?? 0} فعال`}
          color="text-emerald-300"
        />
        <StatCard
          icon={Zap}
          label="ترافیک کل"
          value={stats ? formatBytes(stats.totals.totalUsed) : "—"}
          hint="مصرف تجمعی"
          color="text-cyan-300"
        />
        <StatCard
          icon={Wifi}
          label="اتصالات آنلاین"
          value={stats ? String(stats.relay.active) : "—"}
          hint={`${stats?.relay.total ?? 0} تجمعی`}
          color="text-violet-300"
        />
        <StatCard
          icon={Gauge}
          label="لینک‌های فعال"
          value={stats ? String(stats.totals.activeLinks) : "—"}
          hint={`${Math.max(0, (stats?.totals.totalLinks ?? 0) - (stats?.totals.activeLinks ?? 0))} غیرفعال`}
          color="text-amber-300"
        />
      </div>

      {/* Chart */}
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">روند ترافیک</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">جمع ورودی و خروجی در بازهٔ زمانی</p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
            {(Object.keys(rangeLabels) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  range === r
                    ? "bg-gradient-to-l from-emerald-400/20 to-cyan-400/10 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.25)]"
                    : "text-[var(--muted)] hover:text-white"
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>
        <TrafficChart points={stats?.points ?? []} loading={!stats} />
        <div className="mt-3 flex items-center gap-4 text-[11px] text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-5 rounded-full bg-gradient-to-l from-emerald-400 to-cyan-400" />
            ترافیک ورودی (دانلود)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-5 rounded-full border-t-2 border-dashed border-cyan-400/60" />
            ترافیک خروجی (آپلود)
          </span>
        </div>
      </div>

      {/* Top links */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">بیشترین مصرف</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">لینک‌ها بر اساس ترافیک مصرفی</p>
          </div>
          <Link href="/dashboard/links" className="btn btn-ghost !px-3 !py-1.5 text-xs">
            مدیریت لینک‌ها
            <ArrowLeft size={14} />
          </Link>
        </div>

        {!stats ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : stats.top.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-[var(--muted)]">
            هنوز لینکی ساخته نشده است
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.top.map((link) => {
              const pct = usagePercent(link);
              return (
                <div key={link.id} className="rounded-xl bg-white/[0.03] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`status-dot ${link.enabled ? "live" : "off"}`} />
                      <span className="truncate text-sm font-medium">{link.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[11px] text-[var(--muted)]">
                      <span className="tabular">{formatBytes(link.usedBytes)}</span>
                      <span>/</span>
                      <span>{remainingLabel(link)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="progress-track flex-1">
                      <div
                        className="progress-fill"
                        style={{ width: link.quotaBytes === 0 ? "4%" : `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-left text-[11px] text-[var(--muted)] tabular">
                      {link.quotaBytes === 0 ? "∞" : `٪${pct.toLocaleString("fa-IR")}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
          خطا در دریافت داده‌ها — تلاش مجدد خودکار ادامه دارد.
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
}: {
  icon: typeof Link2;
  label: string;
  value: string;
  hint: string;
  color: string;
}) {
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--muted)]">{label}</span>
        <Icon size={15} className={color} />
      </div>
      <div className="mt-2.5 text-2xl font-extrabold tracking-tight tabular">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--muted)]">{hint}</div>
    </div>
  );
}
