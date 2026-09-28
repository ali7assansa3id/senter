"use client";

import { useEffect, useState } from "react";

type Group = {
  id: string;
  name: string;
  gradeLevel: string | null;
  maxStudents: number | null;
  teacher: { fullName: string } | null;
  subject: { name: string } | null;
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
  _count: { groupStudents: number };
};

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gradeLevel: "",
    maxStudents: "",
    dayOfWeek: "0",
    startTime: "16:00",
    endTime: "18:00",
  });

  async function load() {
    const res = await fetch("/api/groups");
    const data = await res.json();
    if (data.success) setGroups(data.data.groups);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        gradeLevel: form.gradeLevel || undefined,
        maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
        schedules: [
          {
            dayOfWeek: Number(form.dayOfWeek),
            startTime: form.startTime,
            endTime: form.endTime,
          },
        ],
      }),
    });
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المجموعات</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "إلغاء" : "+ إنشاء مجموعة"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">اسم المجموعة *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">الصف</label>
            <input className="input" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} />
          </div>
          <div>
            <label className="label">الحد الأقصى للطلاب</label>
            <input className="input" type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} />
          </div>
          <div>
            <label className="label">يوم الحصة</label>
            <select className="input" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {days.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">من</label>
            <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div>
            <label className="label">إلى</label>
            <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary">حفظ المجموعة</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.id} className="card">
            <div className="font-semibold text-lg">{g.name}</div>
            <div className="text-sm text-slate-500 mt-1">
              {g.gradeLevel || "—"} · المدرس: {g.teacher?.fullName || "غير محدد"}
            </div>
            <div className="text-sm text-slate-600 mt-2">
              الطلاب: {g._count.groupStudents}
              {g.maxStudents ? ` / ${g.maxStudents}` : ""}
            </div>
            {g.schedules.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {g.schedules.map((s, i) => (
                  <span key={i} className="inline-block bg-slate-100 rounded px-2 py-0.5 ml-1">
                    {days[s.dayOfWeek]} {s.startTime}–{s.endTime}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-slate-400 col-span-2 text-center py-8">لا توجد مجموعات</div>
        )}
      </div>
    </div>
  );
}
