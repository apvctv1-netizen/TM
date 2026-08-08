import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPersonnelWorkbook } from "@/lib/excel/export";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Bạn chưa đăng nhập." }, { status: 401 });
  }

  const { data: allowed } = await supabase.rpc("has_permission", {
    p_feature: "reports",
    p_level: "view",
  });
  if (!allowed) {
    return NextResponse.json({ message: "Bạn không có quyền xuất báo cáo." }, { status: 403 });
  }

  const [{ data: employees }, { data: partners }, { data: positions }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "employee_code, full_name, start_date, end_date, gender, dob, id_number, id_issue_date, id_issue_place, permanent_address, phone, email, education_level, partner_code, position_code, contract_type, note"
      )
      .order("employee_code", { ascending: true }),
    supabase.from("partners").select("code, name"),
    supabase.from("positions").select("code, name"),
  ]);

  const partnerNames = new Map((partners ?? []).map((p) => [p.code, p.name]));
  const positionNames = new Map((positions ?? []).map((p) => [p.code, p.name]));

  const buffer = buildPersonnelWorkbook(employees ?? [], partnerNames, positionNames);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="DSNS_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
