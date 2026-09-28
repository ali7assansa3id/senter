import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SENTER — سنتر",
  description: "نظام إدارة السناتر التعليمية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 font-arabic antialiased">
        {children}
      </body>
    </html>
  );
}
