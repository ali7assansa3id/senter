import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, logAudit } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, email, password } = body;

    if ((!phone && !email) || !password) {
      return jsonError("أدخل الهاتف أو البريد مع كلمة المرور");
    }

    const user = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          phone ? { phone } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as object[],
      },
      include: {
        userRoles: {
          where: { deletedAt: null },
          include: { role: true },
          take: 1,
        },
      },
    });

    if (!user) return jsonError("بيانات الدخول غير صحيحة", 401);

    // قفل الحساب بعد 5 محاولات (FR-002)
    if (user.status === "locked" && user.lockedUntil && user.lockedUntil > new Date()) {
      return jsonError("الحساب مقفل مؤقتاً. حاول لاحقاً", 423);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const update: { failedLoginAttempts: number; status?: string; lockedUntil?: Date } = {
        failedLoginAttempts: attempts,
      };
      if (attempts >= 5) {
        update.status = "locked";
        update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة
      }
      await prisma.user.update({ where: { id: user.id }, data: update });
      return jsonError("بيانات الدخول غير صحيحة", 401);
    }

    // إعادة تعيين المحاولات
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, status: "active", lockedUntil: null },
    });

    const userRole = user.userRoles[0];
    const roleName = userRole?.role?.name || "staff";
    const centerId = userRole?.tenantId || null;

    // إنشاء جلسة
    await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    const token = await signToken({
      userId: user.id,
      centerId,
      role: roleName,
      fullName: user.fullName,
    });

    const cookieStore = await cookies();
    cookieStore.set("senter_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await logAudit({
      tenantId: centerId,
      userId: user.id,
      action: "accounts.login",
      entityType: "user",
      entityId: user.id,
    });

    return jsonOk({
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
      },
      centerId,
      role: roleName,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
