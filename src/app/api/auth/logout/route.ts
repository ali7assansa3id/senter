import { cookies } from "next/headers";
import { jsonOk } from "@/lib/api";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("senter_token");
  return jsonOk({ message: "تم تسجيل الخروج" });
}
