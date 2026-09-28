"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "لوحة التحكم" },
  { href: "/students", label: "الطلاب" },
  { href: "/teachers", label: "المدرسون" },
  { href: "/groups", label: "المجموعات" },
  { href: "/attendance", label: "الحضور" },
];

export default function Sidebar({
  userName,
  centerName,
}: {
  userName?: string;
  centerName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-primary-900 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-primary-800">
        <div className="font-bold text-lg">SENTER</div>
        <div className="text-primary-200 text-sm mt-1 truncate">{centerName || "السنتر"}</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-3 py-2.5 rounded-lg text-sm transition ${
              pathname === l.href || pathname.startsWith(l.href + "/")
                ? "bg-primary-700 text-white"
                : "text-primary-100 hover:bg-primary-800"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-primary-800">
        <div className="text-sm text-primary-200 mb-2">{userName}</div>
        <button onClick={logout} className="text-sm text-red-300 hover:text-red-200">
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
