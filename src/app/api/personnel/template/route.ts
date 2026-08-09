import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPersonnelTemplateWorkbook } from "@/lib/excel/export";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Bạn chưa đăng nhập." }, { status: 401 });
  }

  const { data: allowed } = await supabase.rpc("has_permission", {
    p_feature: "personnel",
    p_level: "edit",
  });
  if (!allowed) {
    return NextResponse.json({ message: "Bạn không có quyền nhập nhân sự." }, { status: 403 });
  }

  const buffer = buildPersonnelTemplateWorkbook();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Mau_Nhap_Nhan_Su.xlsx"`,
    },
  });
}
