import Link from "next/link";
import { ArrowLeft, Gauge, Link2, QrCode, ShieldCheck, Activity, Globe } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "مدیریت لینک نامحدود",
    desc: "ساخت و مدیریت هر تعداد لینک با نام، تاریخ انقضا و وضعیت فعال/غیرفعال.",
  },
  {
    icon: Gauge,
    title: "سهمیه مصرف اختصاصی",
    desc: "برای هر لینک محدودیت ترافیک بر حسب گیگابایت تعریف کنید؛ مصرف به‌صورت لحظه‌ای کنترل می‌شود.",
  },
  {
    icon: Activity,
    title: "مانیتورینگ زنده",
    desc: "نمودار ترافیک لحظه‌ای، شمارش اتصالات آنلاین و گزارش مصرف هر لینک.",
  },
  {
    icon: QrCode,
    title: "خروجی QR و سابسکریپشن",
    desc: "برای هر لینک QR Code و آدرس سابسکریپشن آمادهٔ ایمپورت در کلاینت‌ها.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b0f17]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-[#052e22]">
              <Globe size={19} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">API Gateway</div>
              <div className="text-[11px] text-[var(--muted)]">پنل مدیریت درگاه یکپارچه</div>
            </div>
          </div>
          <Link href="/login" className="btn btn-primary">
            ورود به پنل
            <ArrowLeft size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <section className="flex flex-col items-center pb-16 pt-20 text-center">
          <div className="badge mb-6 border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <span className="status-dot live" />
            سرویس فعال و پایدار
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.25] tracking-tight sm:text-6xl sm:leading-[1.15]">
            درگاه یکپارچهٔ
            <span className="bg-gradient-to-l from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              {" "}مدیریت API{" "}
            </span>
            شما
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-8 text-[var(--muted)] sm:text-lg">
            ساخت، مانیتورینگ و مدیریت لینک‌ها و ترافیک — همه از یک داشبورد سبک و سریع.
            ذخیره‌سازی دائمی، احراز هویت امن و استقرار آسان روی Railway.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="btn btn-primary px-6 py-3 text-sm">
              ورود به داشبورد
              <ArrowLeft size={16} />
            </Link>
            <a href="/api/health" target="_blank" rel="noreferrer" className="btn btn-ghost px-6 py-3 text-sm">
              <ShieldCheck size={16} />
              بررسی وضعیت سرویس
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-24 sm:grid-cols-2">
          {features.map((f, i) => (
            <div key={f.title} className="card card-hover fade-up p-6" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
                <f.icon size={20} />
              </div>
              <h3 className="mb-2 text-base font-bold">{f.title}</h3>
              <p className="text-sm leading-7 text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/5 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-xs text-[var(--muted)]">
          <span>API Gateway — پنل مدیریت درگاه یکپارچه</span>
          <span className="flex items-center gap-2">
            <span className="status-dot live" />
            نسخه ۲٫۰
          </span>
        </div>
      </footer>
    </div>
  );
}
