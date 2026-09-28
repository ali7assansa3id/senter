import { requireAuth, tenantFilter, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const where: Record<string, unknown> = {
      centerId: session.centerId,
      deletedAt: null,
    };
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        compensationModels: { where: { isActive: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return jsonOk({ teachers });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST — إنشاء مدرس (FR-030) + نموذج مستحقات (FR-031)
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!session.centerId) return jsonError("لا يوجد سنتر", 403);

    const body = await req.json();
    const { fullName, phone, email, specialties, subjects, gradeLevels, bio, compensation } = body;

    if (!fullName) return jsonError("اسم المدرس مطلوب");

    const teacher = await prisma.$transaction(async (tx) => {
      const t = await tx.teacher.create({
        data: {
          centerId: session.centerId!,
          fullName,
          phone: phone || null,
          email: email || null,
          specialtiesJson: specialties || [],
          subjectsJson: subjects || [],
          gradeLevelsJson: gradeLevels || [],
          bio: bio || null,
        },
      });

      if (compensation?.modelType && compensation?.value != null) {
        await tx.teacherCompensationModel.create({
          data: {
            teacherId: t.id,
            modelType: compensation.modelType, // fixed_per_session | percentage | per_student | custom
            value: compensation.value,
            notes: compensation.notes || null,
          },
        });
      }

      return t;
    });

    await logAudit({
      tenantId: session.centerId,
      userId: session.userId,
      action: "teachers.create",
      entityType: "teacher",
      entityId: teacher.id,
    });

    return jsonOk(teacher, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
