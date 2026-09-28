import { requireAuth, tenantFilter, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

// GET /api/students/:id — سجل الطالب الشامل (FR-024)
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { id, ...tenantFilter(session.centerId) },
      include: {
        studentParents: {
          include: { parent: true },
        },
        groupStudents: {
          where: { status: "active" },
          include: {
            group: {
              select: { id: true, name: true, gradeLevel: true, teacher: { select: { fullName: true } } },
            },
          },
        },
        attendance: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            session: { select: { scheduledAt: true, group: { select: { name: true } } } },
          },
        },
      },
    });

    if (!student) return jsonError("الطالب غير موجود", 404);
    return jsonOk(student);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/students/:id — تعديل / أرشفة (FR-021)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.student.findFirst({
      where: { id, ...tenantFilter(session.centerId) },
    });
    if (!existing) return jsonError("الطالب غير موجود", 404);

    const allowed = ["fullName", "birthDate", "gradeLevel", "classYear", "nationalId", "phone", "status", "notes"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        data[key] = key === "birthDate" && body[key] ? new Date(body[key]) : body[key];
      }
    }

    // Soft archive instead of hard delete (BR-002)
    if (body.archive === true) {
      data.status = "withdrawn";
      data.deletedAt = new Date();
    }

    const student = await prisma.student.update({
      where: { id },
      data,
    });

    await logAudit({
      tenantId: session.centerId,
      userId: session.userId,
      action: body.archive ? "students.archive" : "students.update",
      entityType: "student",
      entityId: id,
      oldValues: existing,
      newValues: data,
    });

    return jsonOk(student);
  } catch (err) {
    return handleApiError(err);
  }
}
