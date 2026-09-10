import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Gateway | پنل مدیریت",
  description: "پنل مدیریت درگاه یکپارچه API — مدیریت لینک، ترافیک و سهمیه مصرف",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
