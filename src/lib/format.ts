// Persian-friendly formatting helpers.

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function remainingLabel(link: { quotaBytes: number; usedBytes: number }): string {
  if (link.quotaBytes === 0) return "نامحدود";
  const remaining = Math.max(0, link.quotaBytes - link.usedBytes);
  return formatBytes(remaining);
}

export function usagePercent(link: { quotaBytes: number; usedBytes: number }): number {
  if (link.quotaBytes === 0) return 0;
  return Math.min(100, Math.round((link.usedBytes / link.quotaBytes) * 100));
}

export function formatUptime(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const seconds = Math.floor(ms / 1000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} روز و ${h} ساعت`;
  if (h > 0) return `${h} ساعت و ${m} دقیقه`;
  return `${m} دقیقه`;
}
