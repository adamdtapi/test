"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Check,
  Clock,
  Globe,
  KeyRound,
  Loader2,
  Route,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatUptime } from "@/lib/format";

type SystemInfo = {
  host: string;
  path: string;
  relay: {
    active: number;
    total: number;
    lastReport: number;
    upSince: number;
  };
};

export default function SettingsPage() {
  const toast = useToast();
  const [info, setInfo] = useState<SystemInfo | null>(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, linksRes] = await Promise.all([
        fetch("/api/stats?range=10m", { cache: "no-store" }),
        fetch("/api/links", { cache: "no-store" }),
      ]);
      if (statsRes.ok && linksRes.ok) {
        const stats = await statsRes.json();
        const links = await linksRes.json();
        if (stats.ok && links.ok) {
          setInfo({
            host: links.host || "—",
            path: links.path || "/api/v1/ws",
            relay: stats.relay,
          });
        }
      }
    } catch {
      // ignore — retry next round
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const relayLive = info ? info.relay.lastReport > 0 && Date.now() - info.relay.lastReport < 30_000 : false;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">تنظیمات</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">مدیریت حساب و اطلاعات سرویس</p>
      </div>

      {/* Password */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
            <KeyRound size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold">تغییر رمز عبور</h2>
            <p className="text-xs text-[var(--muted)]">رمز حساب مدیر (admin) را به‌روز کنید</p>
          </div>
        </div>
        <PasswordForm toast={toast} />
      </div>

      {/* System info */}
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-300">
            <Server size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold">اطلاعات سرویس</h2>
            <p className="text-xs text-[var(--muted)]">پیکربندی اجرای فعلی درگاه</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            icon={Globe}
            label="دامنه عمومی"
            value={<span className="mono text-emerald-300/90">{info?.host || "—"}</span>}
          />
          <InfoRow
            icon={Route}
            label="مسیر ورودی هسته"
            value={<span className="mono text-cyan-300/90">{info?.path || "—"}</span>}
          />
          <InfoRow
            icon={Activity}
            label="وضعیت هسته"
            value={
              <span className={`flex items-center gap-2 ${relayLive ? "text-emerald-300" : "text-amber-300"}`}>
                <span className={`status-dot ${relayLive ? "live" : "idle"}`} />
                {relayLive ? "در حال اجرا" : "در انتظار اتصال"}
              </span>
            }
          />
          <InfoRow
            icon={Clock}
            label="مدت زمان اجرا"
            value={
              <span className="tabular">
                {info?.relay.upSince ? formatUptime(Date.now() - info.relay.upSince) : "—"}
              </span>
            }
          />
          <InfoRow
            icon={ShieldCheck}
            label="موتور"
            value={<span>Node.js (سازگار با Railway)</span>}
          />
          <InfoRow
            icon={Server}
            label="نسخه"
            value={<span className="tabular">v2.0.0</span>}
          />
        </div>
      </div>

      {/* Help */}
      <div className="card border-dashed p-6">
        <h2 className="mb-3 text-sm font-bold">راهنمای سریع</h2>
        <ul className="space-y-2.5 text-sm leading-7 text-[var(--muted)]">
          <li className="flex gap-2.5">
            <Check size={15} className="mt-1.5 shrink-0 text-emerald-400" />
            برای اتصال کلاینت، از صفحهٔ «لینک‌ها» لینک اتصال یا QR را وارد کلاینت کنید.
          </li>
          <li className="flex gap-2.5">
            <Check size={15} className="mt-1.5 shrink-0 text-emerald-400" />
            آدرس سابسکریپشن هر لینک برای ایمپورت گروهی در کلاینت قابل استفاده است.
          </li>
          <li className="flex gap-2.5">
            <Check size={15} className="mt-1.5 shrink-0 text-emerald-400" />
            سهمیهٔ صفر به‌معنای نامحدود بودن ترافیک آن لینک است.
          </li>
          <li className="flex gap-2.5">
            <Check size={15} className="mt-1.5 shrink-0 text-emerald-400" />
            تاریخ انقضا و مصرف لینک‌ها به‌صورت لحظه‌ای توسط هسته کنترل می‌شود.
          </li>
        </ul>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
      <span className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
        <Icon size={14} className="text-[var(--muted)]" />
        {label}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function PasswordForm({ toast }: { toast: (m: string, k?: "success" | "error") => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (next.length < 6) {
      setError("رمز جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (next !== confirm) {
      setError("تکرار رمز جدید مطابقت ندارد");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (data.ok) {
        toast("رمز عبور با موفقیت تغییر کرد");
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setError(data.error || "خطا در تغییر رمز");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block max-w-md">
        <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">رمز فعلی</span>
        <input
          type="password"
          className="input"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <div className="grid gap-4 sm:max-w-2xl sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">رمز جدید</span>
          <input
            type="password"
            className="input"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">تکرار رمز جدید</span>
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
      </div>

      {error && (
        <div className="max-w-md rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <button onClick={submit} disabled={busy || !current || !next || !confirm} className="btn btn-primary">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        ذخیره رمز جدید
      </button>
    </div>
  );
}
