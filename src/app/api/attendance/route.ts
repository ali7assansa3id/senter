import { requireAuth, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

// POST /api/attendance — تسجيل حضور يدوي (FR-050)
// body: { sessionId, records: [{ studentId, status, notes? }] }
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!session.centerId) return jsonError("لا يوجد سنتر", 403);

    const body = await req.json();
    const { sessionId, records } = body as {
      sessionId: string;
      records: { studentId: string; status: string; notes?: string }[];
    };

    if (!sessionId || !records?.length) {
      return jsonError("معرّف الحصة وسجلات الحضور مطلوبة");
    }

    const allowed = ["present", "absent", "late", "excused"];
    for (const r of records) {
      if (!allowed.includes(r.status)) {
        return jsonError(`حالة غير صحيحة: ${r.status}`);
      }
    }

    // التحقق أن الحصة تابعة للسنتر
    const sess = await prisma.sessionClass.findFirst({
      where: {
        id: sessionId,
        group: { centerId: session.centerId, deletedAt: null },
      },
      include: { group: true },
    });
    if (!sess) return jsonError("الحصة غير موجودة", 404);

    const results = [];
    for (const r of records) {
      // BR-003: مرة واحدة فقط — upsert
      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: { sessionId, studentId: r.studentId },
        },
      });

      if (existing) {
        // تعديل + audit (FR-054)
        if (existing.status !== r.status) {
          await prisma.attendanceAudit.create({
            data: {
              attendanceId: existing.id,
              oldStatus: existing.status,
              newStatus: r.status,
              reason: r.notes || "تعديل يدوي",
              changedById: session.userId,
            },
          });
          const updated = await prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: { status: r.status, notes: r.notes, recordedById: session.userId },
          });
          results.push(updated);
        } else {
          results.push(existing);
        }
      } else {
        const created = await prisma.attendanceRecord.create({
          data: {
            sessionId,
            studentId: r.studentId,
            status: r.status,
            notes: r.notes,
            recordedById: session.userId,
          },
        });
        results.push(created);

        // FR-052: إشعار ولي الأمر عند الغياب
        if (r.status === "absent") {
          const links = await prisma.studentParent.findMany({
            where: { studentId: r.studentId, isPrimary: true },
            include: { parent: true, student: true },
          });
          for (const link of links) {
            if (link.parent.userId) {
              await prisma.notification.create({
                data: {
                  tenantId: session.centerId,
                  userId: link.parent.userId,
                  type: "absence_alert",
                  title: "إشعار غياب",
                  body: `تم تسجيل غياب ${link.student.fullName} في حصة ${sess.group.name}`,
                  dataJson: { studentId: r.studentId, sessionId },
                },
              });
            }
          }
        }
      }
    }

    await logAudit({
      tenantId: session.centerId,
      userId: session.userId,
      action: "attendance.record",
      entityType: "session",
      entityId: sessionId,
    });

    return jsonOk({ records: results }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

// GET /api/attendance?sessionId=...
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return jsonError("sessionId مطلوب");

    const records = await prisma.attendanceRecord.findMany({
      where: {
        sessionId,
        session: { group: { centerId: session.centerId! } },
      },
      include: {
        student: { select: { id: true, fullName: true, code: true } },
      },
    });

    return jsonOk({ records });
  } catch (err) {
    return handleApiError(err);
  }
}
