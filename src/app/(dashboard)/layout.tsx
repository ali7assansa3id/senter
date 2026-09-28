import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let centerName = "";
  if (session.centerId) {
    const c = await prisma.center.findFirst({
      where: { id: session.centerId },
      select: { name: true },
    });
    centerName = c?.name || "";
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.fullName} centerName={centerName} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
