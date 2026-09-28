import { requireAuth, tenantFilter, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireAuth();
    const groups = await prisma.group.findMany({
      where: { ...tenantFilter(session.centerId) },
      include: {
        teacher: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        schedules: true,
        _count: { select: { groupStudents: true } },
      },
      orderBy: { name: "asc" },
    });
    return jsonOk({ groups });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST — إنشاء مجموعة (FR-040) + جدول أسبوعي (FR-041)
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!session.centerId) return jsonError("لا يوجد سنتر", 403);

    const body = await req.json();
    const {
      name,
      gradeLevel,
      subjectId,
      teacherId,
      roomId,
      branchId,
      maxStudents,
      defaultSubscriptionType,
      schedules, // [{ dayOfWeek, startTime, endTime }]
    } = body;

    if (!name) return jsonError("اسم المجموعة مطلوب");

    // التحقق من تعارض المدرس/القاعة (مبسط)
    if (teacherId && schedules?.length) {
      for (const s of schedules) {
        const conflict = await prisma.groupSchedule.findFirst({
          where: {
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            group: {
              teacherId,
              deletedAt: null,
              centerId: session.centerId,
            },
          },
        });
        if (conflict) {
          return jsonError(`تعارض في جدول المدرس يوم ${s.dayOfWeek} الساعة ${s.startTime}`);
        }
      }
    }

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          centerId: session.centerId!,
          name,
          gradeLevel: gradeLevel || null,
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          roomId: roomId || null,
          branchId: branchId || null,
          maxStudents: maxStudents || null,
          defaultSubscriptionType: defaultSubscriptionType || null,
        },
      });

      if (schedules?.length) {
        await tx.groupSchedule.createMany({
          data: schedules.map((s: { dayOfWeek: number; startTime: string; endTime: string }) => ({
            groupId: g.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }

      return g;
    });

    await logAudit({
      tenantId: session.centerId,
      userId: session.userId,
      action: "groups.create",
      entityType: "group",
      entityId: group.id,
    });

    return jsonOk(group, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
