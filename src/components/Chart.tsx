"use client";

import { useId } from "react";

export type ChartPoint = { t: string; in: number; out: number };

const W = 720;
const H = 210;
const PAD = 10;

export function TrafficChart({ points, loading }: { points: ChartPoint[]; loading?: boolean }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  if (points.length === 0) {
    return (
      <div className="flex h-[210px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-[var(--muted)]">
        {loading ? "در حال دریافت داده‌ها…" : "هنوز ترافیکی ثبت نشده است"}
      </div>
    );
  }

  const max = Math.max(1, ...points.map((p) => Math.max(p.in, p.out, p.in + p.out)));
  const step = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  const totalPath =
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.in + p.out).toFixed(1)}`)
      .join(" ") + ` L${x(points.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;

  const inLine = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.in).toFixed(1)}`)
    .join(" ");

  const outLine = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.out).toFixed(1)}`)
    .join(" ");

  const peak = Math.max(...points.map((p) => p.in + p.out));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[210px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={H * f}
            y2={H * f}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 5"
          />
        ))}

        <path d={totalPath} fill={`url(#${gid}-area)`} stroke="none" />
        <path
          d={inLine}
          fill="none"
          stroke={`url(#${gid}-line)`}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={outLine}
          fill="none"
          stroke="rgba(34,211,238,0.45)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="pointer-events-none absolute right-3 top-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-[var(--muted)] backdrop-blur">
        اوج: <span className="tabular text-emerald-300">{fmt(peak)}</span>/ثانیه
      </div>
    </div>
  );
}

function fmt(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}
