"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    centerName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { phone: form.phone || undefined, email: form.email || undefined, password: form.password }
          : form;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "حدث خطأ");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-bl from-primary-900 to-primary-600">
      <div className="card w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-800">SENTER — سنتر</h1>
          <p className="text-slate-500 text-sm mt-1">نظام إدارة السناتر التعليمية</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              mode === "login" ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              mode === "register" ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            إنشاء حساب سنتر
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="label">الاسم الكامل</label>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">اسم السنتر</label>
                <input
                  className="input"
                  value={form.centerName}
                  onChange={(e) => setForm({ ...form, centerName: e.target.value })}
                  placeholder="اختياري"
                />
              </div>
            </>
          )}
          <div>
            <label className="label">رقم الهاتف</label>
            <input
              className="input"
              type="tel"
              placeholder="01xxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              dir="ltr"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="label">البريد الإلكتروني (اختياري)</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                dir="ltr"
              />
            </div>
          )}
          <div>
            <label className="label">كلمة المرور</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 border border-red-200">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "جاري..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>
      </div>
    </div>
  );
}
