"use client";

export default function AttendancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">تسجيل الحضور</h1>
      <p className="text-slate-500 mb-6">الحضور اليدوي — FR-050</p>

      <div className="card">
        <p className="text-slate-600 text-sm leading-relaxed">
          لتسجيل الحضور عبر الـ API:
        </p>
        <pre className="bg-slate-900 text-green-300 text-xs p-4 rounded-lg mt-3 overflow-x-auto dir-ltr text-left" dir="ltr">
{`POST /api/attendance
{
  "sessionId": "<uuid>",
  "records": [
    { "studentId": "<uuid>", "status": "present" },
    { "studentId": "<uuid>", "status": "absent" },
    { "studentId": "<uuid>", "status": "late" }
  ]
}`}
        </pre>
        <ul className="mt-4 text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>الحالات: present | absent | late | excused</li>
          <li>يُمنع تكرار التسجيل لنفس الطالب في نفس الحصة (BR-003)</li>
          <li>أي تعديل يُسجَّل في attendance_audit (FR-054)</li>
          <li>الغياب يُرسل إشعاراً لولي الأمر (FR-052 + BR-005)</li>
        </ul>
      </div>
    </div>
  );
}
