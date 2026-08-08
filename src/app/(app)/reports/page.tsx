import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { ReportsPanel } from "@/components/reports/reports-panel";

export default async function ReportsPage() {
  await requirePermission("reports", "view");

  const supabase = await createClient();
  const { data: periods } = await supabase
    .from("payroll_periods")
    .select("id, period_year, period_month, status")
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">Xuất dữ liệu Nhân sự và Bảng lương ra file Excel.</p>
      </div>
      <ReportsPanel periods={periods ?? []} />
    </div>
  );
}
