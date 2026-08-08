import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { PayrollEntriesTable } from "@/components/payroll/payroll-entries-table";

export default async function PayrollPeriodPage(props: PageProps<"/payroll/[periodId]">) {
  await requirePermission("payroll", "view");
  const { periodId } = await props.params;

  const supabase = await createClient();

  const [{ data: period }, { data: canEdit }] = await Promise.all([
    supabase.from("payroll_periods").select("*").eq("id", periodId).single(),
    supabase.rpc("has_permission", { p_feature: "payroll", p_level: "edit" }),
  ]);

  if (!period) notFound();

  const { data: entries } = await supabase
    .from("payroll_entries")
    .select("*, employees(full_name, employee_code)")
    .eq("period_id", periodId)
    .order("employees(employee_code)", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bảng lương tháng {period.period_month}/{period.period_year}
          </h1>
          <p className="text-sm text-muted-foreground">
            Công tự động lấy từ chấm công; các cột nhập tay được giữ nguyên khi tính lại.
          </p>
        </div>
        <Badge variant={period.status === "locked" ? "outline" : "secondary"}>
          {period.status === "locked" ? "Đã khoá" : "Đang mở"}
        </Badge>
      </div>

      <PayrollEntriesTable
        periodId={periodId}
        entries={entries ?? []}
        canEdit={!!canEdit && period.status !== "locked"}
      />
    </div>
  );
}
