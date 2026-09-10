"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  Plus,
  Power,
  QrCode,
  RefreshCw,
  Rss,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatBytes, formatDate, remainingLabel, usagePercent } from "@/lib/format";

type LinkItem = {
  id: number;
  uuid: string;
  name: string;
  quotaBytes: number;
  usedBytes: number;
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastSeenAt: string | null;
  url: string;
  subUrl: string;
};

export default function LinksPage() {
  const toast = useToast();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [host, setHost] = useState("");
  const [path, setPath] = useState("/api/v1/ws");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [qrLink, setQrLink] = useState<LinkItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LinkItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/links", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setLinks(data.links);
        setHost(data.host);
        if (data.path) setPath(data.path);
      }
    } catch {
      // retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} کپی شد`);
    } catch {
      toast("خطا در کپی کردن", "error");
    }
  }

  async function toggle(link: LinkItem) {
    setBusyId(link.id);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !link.enabled }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(link.enabled ? "لینک غیرفعال شد" : "لینک فعال شد");
        await load();
      } else {
        toast(data.error || "خطا در تغییر وضعیت", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function resetTraffic(link: LinkItem) {
    setBusyId(link.id);
    try {
      const res = await fetch(`/api/links/${link.id}/reset`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast("مصرف لینک صفر شد");
        await load();
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("لینک حذف شد");
        setDeleteTarget(null);
        await load();
      }
    } catch {
      toast("خطا در حذف لینک", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">لینک‌ها</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {host ? (
              <>
                ساخت و مدیریت لینک‌های اتصال — میزبان:{" "}
                <span className="mono text-emerald-300/90">{host}</span>
              </>
            ) : (
              "ساخت و مدیریت لینک‌های اتصال"
            )}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          لینک جدید
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--muted)]">
              <Link2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium">هنوز لینکی ساخته نشده است</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                با دکمهٔ «لینک جدید» اولین لینک اتصال را بسازید.
              </p>
            </div>
            <button onClick={() => setCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              ساخت لینک
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-right text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] text-[var(--muted)]">
                  <th className="px-5 py-3.5 font-medium">نام / وضعیت</th>
                  <th className="px-4 py-3.5 font-medium">شناسه</th>
                  <th className="px-4 py-3.5 font-medium">مصرف / سهمیه</th>
                  <th className="px-4 py-3.5 font-medium">انقضا</th>
                  <th className="px-4 py-3.5 font-medium">آخرین اتصال</th>
                  <th className="px-5 py-3.5 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const pct = usagePercent(link);
                  return (
                    <tr
                      key={link.id}
                      className="group border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`status-dot ${link.enabled ? "live" : "off"}`} />
                          <div>
                            <div className="font-medium leading-5">{link.name}</div>
                            <div className="text-[11px] text-[var(--muted)]">
                              {link.enabled ? "فعال" : "غیرفعال"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => copy(link.uuid, "شناسه")}
                          className="mono text-xs text-[var(--muted)] transition-colors hover:text-emerald-300"
                          title="کپی شناسه"
                        >
                          {link.uuid.slice(0, 8)}…{link.uuid.slice(-4)}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-40">
                          <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--muted)]">
                            <span className="tabular">{formatBytes(link.usedBytes)}</span>
                            <span>{link.quotaBytes === 0 ? "نامحدود" : remainingLabel(link)}</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 90 ? "bg-red-400" : "progress-fill"
                              }`}
                              style={{ width: link.quotaBytes === 0 ? "4%" : `${Math.max(pct, 3)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--muted)]">
                        {link.expiresAt ? formatDate(link.expiresAt) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--muted)]">
                        {link.lastSeenAt ? formatDate(link.lastSeenAt) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <ActionBtn
                            title={link.enabled ? "غیرفعال کردن" : "فعال کردن"}
                            onClick={() => toggle(link)}
                            busy={busyId === link.id}
                            className={link.enabled ? "text-emerald-400" : "text-[var(--muted)]"}
                          >
                            <Power size={15} />
                          </ActionBtn>
                          <ActionBtn title="کپی لینک اتصال" onClick={() => copy(link.url, "لینک اتصال")}>
                            <Copy size={15} />
                          </ActionBtn>
                          <ActionBtn title="کپی لینک سابسکریپشن" onClick={() => copy(link.subUrl, "لینک سابسکریپشن")}>
                            <Rss size={15} />
                          </ActionBtn>
                          <ActionBtn title="نمایش QR Code" onClick={() => setQrLink(link)}>
                            <QrCode size={15} />
                          </ActionBtn>
                          <ActionBtn title="صفر کردن مصرف" onClick={() => resetTraffic(link)} busy={busyId === link.id}>
                            <RefreshCw size={15} />
                          </ActionBtn>
                          <ActionBtn title="حذف لینک" danger onClick={() => setDeleteTarget(link)}>
                            <Trash2 size={15} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <span className="mono rounded-md bg-white/5 px-2 py-1 text-emerald-300/90">{path}</span>
          مسیر ورودی هسته
        </span>
        <span>برای استفاده در کلاینت، لینک اتصال یا QR را وارد کنید.</span>
      </div>

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          await load();
          toast("لینک جدید ساخته شد");
        }}
      />

      <QrModal link={qrLink} onClose={() => setQrLink(null)} />

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-400">
            <Trash2 size={20} />
          </div>
          <h3 className="mt-4 text-base font-bold">حذف لینک «{deleteTarget.name}»؟</h3>
          <p className="mt-1.5 text-sm leading-7 text-[var(--muted)]">
            این عملکرد قابل بازگشت نیست. تمام آمار ترافیک این لینک نیز حذف می‌شود.
          </p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1 py-2.5">
              انصراف
            </button>
            <button
              onClick={confirmDelete}
              disabled={busyId === deleteTarget.id}
              className="btn btn-danger flex-1 py-2.5"
            >
              {busyId === deleteTarget.id ? <Loader2 size={15} className="animate-spin" /> : null}
              حذف لینک
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  busy,
  danger,
  className,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  busy?: boolean;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={busy}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-all hover:bg-white/10 hover:text-white ${
        danger ? "hover:!bg-red-400/10 hover:!text-red-400" : ""
      } ${className || ""}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-sm p-6 shadow-2xl">{children}</div>
    </div>
  );
}

function CreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [quotaGb, setQuotaGb] = useState("");
  const [expireDays, setExpireDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setQuotaGb("");
      setExpireDays("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    if (!name.trim()) {
      setError("نام لینک را وارد کنید");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quotaGb: quotaGb === "" ? 0 : Number(quotaGb),
          expireDays: expireDays === "" ? 0 : Number(expireDays),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await onCreated();
        onClose();
      } else {
        setError(data.error || "خطا در ساخت لینک");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-bold">لینک جدید</h3>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">نام لینک</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: کاربر-۱"
            maxLength={64}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">سهمیه (گیگ)</span>
            <input
              className="input"
              value={quotaGb}
              onChange={(e) => setQuotaGb(e.target.value)}
              type="number"
              min="0"
              step="0.5"
              placeholder="نامحدود"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">انقضا (روز)</span>
            <input
              className="input"
              value={expireDays}
              onChange={(e) => setExpireDays(e.target.value)}
              type="number"
              min="0"
              placeholder="بدون انقضا"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <button onClick={submit} disabled={busy} className="btn btn-primary w-full py-2.5">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          ساخت لینک
        </button>
      </div>
    </Modal>
  );
}

function QrModal({ link, onClose }: { link: LinkItem | null; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (link) {
      QRCode.toDataURL(link.url, {
        width: 420,
        margin: 2,
        color: { dark: "#0b0f17", light: "#ffffff" },
      })
        .then((url) => {
          if (!cancelled) setDataUrl(url);
        })
        .catch(() => setDataUrl(null));
    } else {
      setDataUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [link]);

  if (!link) return null;

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold">QR Code</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{link.name}</p>
        </div>
        <button onClick={onClose} className="text-[var(--muted)] hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="flex justify-center rounded-2xl bg-white p-4">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR" className="h-56 w-56" />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center text-sm text-slate-400">
            در حال تولید…
          </div>
        )}
      </div>

      <button
        onClick={() => {
          navigator.clipboard.writeText(link.url).catch(() => {});
        }}
        className="btn btn-ghost mt-4 w-full py-2.5 text-xs"
      >
        <Copy size={14} />
        کپی لینک اتصال
      </button>
    </Modal>
  );
}
