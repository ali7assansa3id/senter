import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.centerId) return null;

  const [studentsCount, teachersCount, groupsCount, todayAttendance] = await Promise.all([
    prisma.student.count({ where: { centerId: session.centerId, deletedAt: null, status: "active" } }),
    prisma.teacher.count({ where: { centerId: session.centerId, deletedAt: null } }),
    prisma.group.count({ where: { centerId: session.centerId, deletedAt: null } }),
    prisma.attendanceRecord.count({
      where: {
        status: "present",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        session: { group: { centerId: session.centerId } },
      },
    }),
  ]);

  const cards = [
    { label: "الطلاب النشطون", value: studentsCount, color: "bg-blue-500" },
    { label: "المدرسون", value: teachersCount, color: "bg-emerald-500" },
    { label: "المجموعات", value: groupsCount, color: "bg-violet-500" },
    { label: "حضور اليوم", value: todayAttendance, color: "bg-amber-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">لوحة التحكم</h1>
      <p className="text-slate-500 mb-6">مرحباً، {session.fullName}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${c.color} opacity-90`} />
            <div>
              <div className="text-2xl font-bold text-slate-800">{c.value}</div>
              <div className="text-sm text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-700 mb-2">المرحلة 1 — النواة التشغيلية</h2>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>إدارة الحسابات والصلاحيات</li>
          <li>إدارة السنتر والفروع والقاعات</li>
          <li>إدارة الطلاب وأولياء الأمور</li>
          <li>إدارة المدرسين ونماذج المستحقات</li>
          <li>المجموعات والجداول</li>
          <li>تسجيل الحضور اليدوي + إشعار الغياب</li>
        </ul>
      </div>
    </div>
  );
}
