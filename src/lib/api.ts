import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: message, code },
    { status }
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") return jsonError("يجب تسجيل الدخول", 401, "UNAUTHORIZED");
    if (err.message === "NO_TENANT") return jsonError("لا يوجد سنتر مرتبط", 403, "NO_TENANT");
    if (err.message === "FORBIDDEN") return jsonError("ليس لديك صلاحية", 403, "FORBIDDEN");
  }
  console.error(err);
  return jsonError("حدث خطأ غير متوقع", 500);
}
