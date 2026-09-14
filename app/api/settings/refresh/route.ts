import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Karena bot & dashboard beda proses, kita bisa pakai webhook ke Railway
  // Tapi untuk sekarang, cukup return OK — bot akan refresh otomatis tiap 5 menit
  return NextResponse.json({
    success: true,
    message: "Config akan aktif dalam 5 menit (cache TTL)",
  });
}
