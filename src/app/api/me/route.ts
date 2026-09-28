import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        avatarUrl: true,
        preferredLocale: true,
      },
    });

    let center = null;
    if (session.centerId) {
      center = await prisma.center.findFirst({
        where: { id: session.centerId, deletedAt: null },
        select: { id: true, name: true, logoUrl: true, primaryColor: true },
      });
    }

    return jsonOk({ user, center, role: session.role });
  } catch (err) {
    return handleApiError(err);
  }
}
