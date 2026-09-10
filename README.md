# API Gateway

پنل مدیریت درگاه یکپارچه — ساخت و مدیریت لینک، سهمیه ترافیک، نمودار لحظه‌ای و QR Code.
یک سرویس Node.js سبک که روی **Railway** در چند دقیقه بالا می‌آید.

> Unified gateway management panel — link manager, traffic quotas, live charts, QR export. Deployable on Railway in minutes.

---

## ✨ امکانات

- **هسته اتصال**: ورودی WebSocket سازگار با VLESS روی پورت ۴۴۳ (TLS لبهٔ Railway)
- **داشبورد مدیریت**: نمودار ترافیک لحظه‌ای، اتصالات آنلاین، ساخت نامحدود لینک
- **سهمیه ترافیک**: محدودیت بر حسب گیگابایت برای هر لینک + تاریخ انقضا
- **QR Code**: تولید QR برای هر لینک + لینک سابسکریپشن برای کلاینت‌ها
- **ذخیره‌سازی دائمی**: PostgreSQL (داده‌ها با ری‌استارت پاک نمی‌شوند)
- **احراز هویت امن**: سشن مبتنی بر کوکی + هش رمز با scrypt

## ⚡ استقرار روی Railway

| مرحله | کار |
| --- | --- |
| ۱ | این ریپازیتوری را در گیت‌هاب خودتان آپلود کنید |
| ۲ | در [Railway](https://railway.app) یک پروژهٔ جدید بسازید: **New Project → Deploy from GitHub repo** |
| ۳ | یک سرویس **PostgreSQL** به پروژه اضافه کنید: **New → Database → PostgreSQL** |
| ۴ | متغیر `DATABASE_URL` سرویس وب را به سرویس Postgres متصل کنید (Reference Variable) |
| ۵ | متغیر `ADMIN_PASSWORD` را تنظیم کنید (اختیاری — در صورت نبود، رمز تصادفی در لاگ‌ها چاپ می‌شود) |
| ۶ | در **Settings → Networking** یک دامنهٔ عمومی بسازید (متغیر `RAILWAY_PUBLIC_DOMAIN` خودکار ست می‌شود) |
| ۷ | آدرس `https://your-app.up.railway.app/dashboard` را باز کنید |

### متغیرهای محیطی

| متغیر | توضیح | پیش‌فرض |
| --- | --- | --- |
| `PORT` | پورت سرویس (Railway خودکار ست می‌کند) | `3000` |
| `DATABASE_URL` | اتصال PostgreSQL | — |
| `ADMIN_PASSWORD` | رمز اولیهٔ کاربر admin | تصادفی (در لاگ) |
| `RELAY_PATH` | مسیر ورودی هسته | `/api/v1/ws` |
| `RELAY_ENABLED` | `false` برای غیرفعال‌کردن هسته | `true` |

## 💻 توسعه محلی

```bash
git clone https://github.com/<your-username>/api.git
cd api
npm install

# PostgreSQL لازم است
createdb api_dev
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/api_dev

npm run dev
# http://localhost:3000/dashboard
```

## 🧱 معماری

```
Client (v2rayNG / NekoBox)
        │  wss://domain/api/v1/ws
        ▼
┌─────────────────────────────────┐
│  API Gateway (Node.js)          │
│  ├─ Next.js panel + REST API    │
│  ├─ WebSocket relay (VLESS)     │
│  └─ PostgreSQL (links/traffic)  │
└─────────────────────────────────┘
```

- یک پروسه، یک پورت: پنل و هسته روی یک سرور HTTP اجرا می‌شوند
- هسته هر ۵ ثانیه مصرف را در دیتابیس ذخیره می‌کند
- احراز هویت، سهمیه و انقضا به‌صورت لحظه‌ای اعمال می‌شود

## 📄 لایسنس

استفادهٔ شخصی آزاد است.
