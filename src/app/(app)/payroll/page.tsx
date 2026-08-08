import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { PayrollPeriodsPanel } from "@/components/payroll/payroll-periods-panel";

export default async function PayrollPage() {
  await requirePermission("payroll", "view");

  const supabase = await createClient();
  const [{ data: periods }, { data: canEdit }] = await Promise.all([
    supabase
      .from("payroll_periods")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false }),
    supabase.rpc("has_permission", { p_feature: "payroll", p_level: "edit" }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bảng lương</h1>
        <p className="text-sm text-muted-foreground">
          Tính lương theo tháng từ dữ liệu chấm công, xem chi tiết và khoá kỳ khi đã chốt số.
        </p>
      </div>
      <PayrollPeriodsPanel periods={periods ?? []} canEdit={!!canEdit} />
    </div>
  );
}
