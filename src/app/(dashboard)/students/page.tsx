"use client";

import { useEffect, useState } from "react";

type Student = {
  id: string;
  fullName: string;
  gradeLevel: string;
  classYear: string;
  phone: string | null;
  status: string;
  code: string | null;
  studentParents: { parent: { fullName: string; phone: string } }[];
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    gradeLevel: "",
    classYear: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    parentRelation: "أب",
  });

  async function load(search = q) {
    setLoading(true);
    const res = await fetch(`/api/students?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) setStudents(data.data.students);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error);
      return;
    }
    setShowForm(false);
    setForm({
      fullName: "",
      gradeLevel: "",
      classYear: "",
      phone: "",
      parentName: "",
      parentPhone: "",
      parentRelation: "أب",
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">الطلاب</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "إلغاء" : "+ تسجيل طالب"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">اسم الطالب *</label>
            <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">المرحلة *</label>
            <input className="input" required placeholder="إعدادي / ثانوي..." value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} />
          </div>
          <div>
            <label className="label">الصف *</label>
            <input className="input" required placeholder="أولى ثانوي..." value={form.classYear} onChange={(e) => setForm({ ...form, classYear: e.target.value })} />
          </div>
          <div>
            <label className="label">هاتف الطالب</label>
            <input className="input" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">اسم ولي الأمر</label>
            <input className="input" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
          </div>
          <div>
            <label className="label">هاتف ولي الأمر *</label>
            <input className="input" required dir="ltr" placeholder="01xxxxxxxxx" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
          </div>
          {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">حفظ الطالب</button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          className="input max-w-md"
          placeholder="بحث بالاسم أو الهاتف أو الكود..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-right p-3 font-medium text-slate-600">الاسم</th>
              <th className="text-right p-3 font-medium text-slate-600">المرحلة / الصف</th>
              <th className="text-right p-3 font-medium text-slate-600">ولي الأمر</th>
              <th className="text-right p-3 font-medium text-slate-600">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center text-slate-400">جاري التحميل...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا يوجد طلاب</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3 font-medium">{s.fullName}</td>
                  <td className="p-3 text-slate-600">{s.gradeLevel} — {s.classYear}</td>
                  <td className="p-3 text-slate-600">
                    {s.studentParents[0]
                      ? `${s.studentParents[0].parent.fullName} (${s.studentParents[0].parent.phone})`
                      : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {s.status === "active" ? "نشط" : s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
