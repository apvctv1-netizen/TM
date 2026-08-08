import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPayrollWorkbook } from "@/lib/excel/export";

export async function GET(_request: Request, ctx: RouteContext<"/api/payroll/[periodId]/export">) {
  const { periodId } = await ctx.params;

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

  const { data: period } = await supabase
    .from("payroll_periods")
    .select("period_year, period_month")
    .eq("id", periodId)
    .single();

  if (!period) {
    return NextResponse.json({ message: "Không tìm thấy kỳ lương." }, { status: 404 });
  }

  const { data: entries } = await supabase
    .from("payroll_entries")
    .select(
      "contract_type_snapshot, standard_cong, ctt, cong_chinh, tang_ca, cong_truc_le_tet, cong_ca_dem, cong_che_do, so_ngay_nghi_le_tet, cong_ht_dao_tao, ngay_nghi_phep_nam, cght_knn, luong_theo_ctt, tien_tang_ca, tien_truc_le_tet, tien_nghi_le_tet, tien_ca_dem, tien_luong_che_do, tien_phep_nam, thuong_hoan_thanh, thuong_khuyen_khich, ho_tro_an_giua_ca, tien_thuong_cght_knn, tien_trach_nhiem, tien_hoc_viec, bo_sung_luong, tru_bhxh, thu_ho, thue_tncn, truy_thu, tong_luong, tong_khau_tru, tong_luong_nhan, employees!inner(employee_code, full_name)"
    )
    .eq("period_id", periodId)
    .order("employee_code", { referencedTable: "employees", ascending: true });

  const rows = (entries ?? []).map((e) => {
    const employee = e.employees as unknown as { employee_code: number; full_name: string } | null;
    return {
      ...e,
      employee_code: employee?.employee_code ?? 0,
      full_name: employee?.full_name ?? "",
    };
  });

  const buffer = buildPayrollWorkbook(rows);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="BangLuong_${period.period_month}-${period.period_year}.xlsx"`,
    },
  });
}
