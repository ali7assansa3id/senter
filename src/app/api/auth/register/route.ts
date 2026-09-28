import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, logAudit } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, email, password, centerName } = body;

    if (!fullName || !password || (!phone && !email)) {
      return jsonError("الاسم وكلمة المرور ووسيلة تواصل مطلوبة");
    }
    if (password.length < 6) {
      return jsonError("كلمة المرور يجب ألا تقل عن 6 أحرف");
    }

    // تحقق من التكرار
    if (phone) {
      const exists = await prisma.user.findFirst({ where: { phone, deletedAt: null } });
      if (exists) return jsonError("رقم الهاتف مسجل مسبقاً");
    }
    if (email) {
      const exists = await prisma.user.findFirst({ where: { email, deletedAt: null } });
      if (exists) return jsonError("البريد مسجل مسبقاً");
    }

    const passwordHash = await hashPassword(password);

    // إنشاء المستخدم + دور center_owner + سنتر
    const result = await prisma.$transaction(async (tx) => {
      let ownerRole = await tx.role.findFirst({ where: { name: "center_owner" } });
      if (!ownerRole) {
        ownerRole = await tx.role.create({
          data: { name: "center_owner", scope: "center", descriptionAr: "مالك السنتر" },
        });
      }

      const user = await tx.user.create({
        data: {
          fullName,
          phone: phone || null,
          email: email || null,
          passwordHash,
        },
      });

      const center = await tx.center.create({
        data: {
          ownerUserId: user.id,
          name: centerName || `سنتر ${fullName}`,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
          tenantId: center.id,
        },
      });

      // فرع افتراضي
      await tx.branch.create({
        data: {
          centerId: center.id,
          name: "الفرع الرئيسي",
        },
      });

      return { user, center };
    });

    await logAudit({
      tenantId: result.center.id,
      userId: result.user.id,
      action: "accounts.register",
      entityType: "user",
      entityId: result.user.id,
    });

    const token = await signToken({
      userId: result.user.id,
      centerId: result.center.id,
      role: "center_owner",
      fullName: result.user.fullName,
    });

    const cookieStore = await cookies();
    cookieStore.set("senter_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return jsonOk({
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        phone: result.user.phone,
        email: result.user.email,
      },
      center: { id: result.center.id, name: result.center.name },
      role: "center_owner",
    }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
