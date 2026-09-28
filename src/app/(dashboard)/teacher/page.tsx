"use client";

import { useEffect, useState } from "react";

type Teacher = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: string;
  compensationModels: { modelType: string; value: string }[];
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    modelType: "fixed_per_session",
    value: "",
  });

  async function load() {
    const res = await fetch("/api/teachers");
    const data = await res.json();
    if (data.success) setTeachers(data.data.teachers);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        compensation: form.value
          ? { modelType: form.modelType, value: Number(form.value) }
          : undefined,
      }),
    });
    setShowForm(false);
    setForm({ fullName: "", phone: "", email: "", modelType: "fixed_per_session", value: "" });
    load();
  }

  const modelLabels: Record<string, string> = {
    fixed_per_session: "ثابت للحصة",
    percentage: "نسبة من الاشتراك",
    per_student: "لكل طالب",
    custom: "مخصص",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المدرسون</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "إلغاء" : "+ إضافة مدرس"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">الاسم *</label>
            <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">الهاتف</label>
            <input className="input" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">نموذج المستحقات</label>
            <select className="input" value={form.modelType} onChange={(e) => setForm({ ...form, modelType: e.target.value })}>
              <option value="fixed_per_session">ثابت لكل حصة</option>
              <option value="percentage">نسبة من اشتراك الطالب</option>
              <option value="per_student">مبلغ لكل طالب</option>
              <option value="custom">اتفاق مخصص</option>
            </select>
          </div>
          <div>
            <label className="label">القيمة (جنيه)</label>
            <input className="input" type="number" step="0.01" dir="ltr" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">حفظ</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">الهاتف</th>
              <th className="text-right p-3">نموذج المستحقات</th>
              <th className="text-right p-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-medium">{t.fullName}</td>
                <td className="p-3" dir="ltr">{t.phone || "—"}</td>
                <td className="p-3">
                  {t.compensationModels[0]
                    ? `${modelLabels[t.compensationModels[0].modelType] || t.compensationModels[0].modelType}: ${t.compensationModels[0].value} ج.م`
                    : "—"}
                </td>
                <td className="p-3">
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">نشط</span>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا يوجد مدرسون</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
