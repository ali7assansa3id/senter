import { requireAuth, tenantFilter, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

// GET /api/students — قائمة الطلاب (FR-023)
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Number(searchParams.get("limit") || 20));

    const where: Record<string, unknown> = {
      ...tenantFilter(session.centerId),
    };
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { code: { contains: q } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          studentParents: {
            include: { parent: { select: { id: true, fullName: true, phone: true, relation: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return jsonOk({ students, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/students — تسجيل طالب جديد (FR-020)
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!session.centerId) return jsonError("لا يوجد سنتر", 403);

    const body = await req.json();
    const {
      fullName,
      birthDate,
      gradeLevel,
      classYear,
      nationalId,
      phone,
      notes,
      parentName,
      parentPhone,
      parentRelation,
    } = body;

    if (!fullName || !gradeLevel || !classYear) {
      return jsonError("الاسم والمرحلة والصف مطلوبة");
    }
    if (!parentPhone) {
      return jsonError("هاتف ولي الأمر مطلوب");
    }

    // تحقق هاتف مصري بسيط
    const cleanPhone = String(parentPhone).replace(/\s/g, "");
    if (!/^(\+?20|0)?1[0125]\d{8}$/.test(cleanPhone)) {
      return jsonError("رقم هاتف ولي الأمر غير صحيح (يجب أن يكون مصرياً)");
    }

    const result = await prisma.$transaction(async (tx) => {
      // ولي أمر موجود؟
      let parent = await tx.parent.findFirst({
        where: { centerId: session.centerId!, phone: cleanPhone, deletedAt: null },
      });
      if (!parent) {
        parent = await tx.parent.create({
          data: {
            centerId: session.centerId!,
            fullName: parentName || "ولي أمر",
            phone: cleanPhone,
            relation: parentRelation || "ولي أمر",
          },
        });
      }

      const student = await tx.student.create({
        data: {
          centerId: session.centerId!,
          fullName,
          birthDate: birthDate ? new Date(birthDate) : null,
          gradeLevel,
          classYear,
          nationalId: nationalId || null,
          phone: phone || null,
          notes: notes || null,
          createdById: session.userId,
        },
      });

      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          isPrimary: true,
        },
      });

      return { student, parent };
    });

    await logAudit({
      tenantId: session.centerId,
      userId: session.userId,
      action: "students.create",
      entityType: "student",
      entityId: result.student.id,
      newValues: { fullName, gradeLevel, classYear },
    });

    return jsonOk(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
