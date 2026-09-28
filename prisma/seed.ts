import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const roleDefs = [
    { name: "center_owner", scope: "center", descriptionAr: "مالك السنتر" },
    { name: "branch_manager", scope: "center", descriptionAr: "مدير فرع" },
    { name: "staff", scope: "center", descriptionAr: "موظف" },
    { name: "accountant", scope: "center", descriptionAr: "محاسب" },
    { name: "teacher", scope: "center", descriptionAr: "مدرس" },
    { name: "student", scope: "center", descriptionAr: "طالب" },
    { name: "parent", scope: "center", descriptionAr: "ولي أمر" },
  ];

  for (const r of roleDefs) {
    const exists = await prisma.role.findFirst({ where: { name: r.name } });
    if (!exists) await prisma.role.create({ data: r });
  }

  const hash = await bcrypt.hash("123456", 12);
  let user = await prisma.user.findFirst({ where: { phone: "01000000000" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        fullName: "مالك تجريبي",
        phone: "01000000000",
        email: "owner@senter.test",
        passwordHash: hash,
      },
    });
  }

  let center = await prisma.center.findFirst({ where: { ownerUserId: user.id } });
  if (!center) {
    center = await prisma.center.create({
      data: {
        ownerUserId: user.id,
        name: "سنتر النور التجريبي",
        governorate: "القاهرة",
        city: "مدينة نصر",
      },
    });
  }

  const ownerRole = await prisma.role.findFirst({ where: { name: "center_owner" } });
  if (ownerRole) {
    const ur = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: ownerRole.id },
    });
    if (!ur) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: ownerRole.id, tenantId: center.id },
      });
    }
  }

  const branch = await prisma.branch.findFirst({ where: { centerId: center.id } });
  if (!branch) {
    await prisma.branch.create({
      data: { centerId: center.id, name: "الفرع الرئيسي" },
    });
  }

  console.log("✅ Seed completed");
  console.log("   هاتف: 01000000000");
  console.log("   كلمة المرور: 123456");
  console.log("   السنتر:", center.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
