import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PayrollEntriesTable } from "@/components/payroll/payroll-entries-table";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

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

  const year = period.period_year as number;
  const month = period.period_month as number;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEnd = `${year}-${pad2(month)}-${pad2(daysInMonth)}`;

  const [{ data: employees }, { data: shiftTypes }, { data: attendanceEntries }, { data: holidays }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, employee_code, full_name, position_code")
        .or(`end_date.is.null,end_date.gte.${monthStart}`)
        .lte("start_date", monthEnd)
        .order("employee_code", { ascending: true }),
      supabase
        .from("shift_types")
        .select("id, code, label, parent_group, work_unit_fraction")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("attendance_entries")
        .select("employee_id, work_date, shift_type_id, note")
        .gte("work_date", monthStart)
        .lte("work_date", monthEnd),
      supabase.from("holidays").select("holiday_date").gte("holiday_date", monthStart).lte("holiday_date", monthEnd),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <Button variant="outline" size="sm" className="w-fit" asChild>
        <Link href="/payroll">
          <ChevronLeft />
          Quay lại danh sách kỳ lương
        </Link>
      </Button>
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

      <div>
        <h2 className="mb-2 text-lg font-semibold tracking-tight">
          Bảng công tháng {month}/{year}
        </h2>
        <AttendanceGrid
          year={year}
          month={month}
          daysInMonth={daysInMonth}
          employees={employees ?? []}
          shiftTypes={shiftTypes ?? []}
          entries={attendanceEntries ?? []}
          holidayDates={(holidays ?? []).map((h) => h.holiday_date)}
          canEdit={false}
        />
      </div>
    </div>
  );
}
