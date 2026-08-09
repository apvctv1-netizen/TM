import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function AttendancePage(props: PageProps<"/attendance">) {
  await requirePermission("attendance", "view");

  const sp = await props.searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEnd = `${year}-${pad2(month)}-${pad2(daysInMonth)}`;

  const supabase = await createClient();

  const [{ data: employees }, { data: shiftTypes }, { data: entries }, { data: holidays }, { data: canEdit }] =
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
      supabase.rpc("has_permission", { p_feature: "attendance", p_level: "edit" }),
    ]);

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chấm công</h1>
          <p className="text-sm text-muted-foreground">Lưới chấm công theo tháng cho toàn bộ nhân viên.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/attendance?year=${prevMonth.year}&month=${prevMonth.month}`}>
              <ChevronLeft />
            </Link>
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            Tháng {month}/{year}
          </span>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/attendance?year=${nextMonth.year}&month=${nextMonth.month}`}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>

      <AttendanceGrid
        year={year}
        month={month}
        daysInMonth={daysInMonth}
        employees={employees ?? []}
        shiftTypes={shiftTypes ?? []}
        entries={entries ?? []}
        holidayDates={(holidays ?? []).map((h) => h.holiday_date)}
        canEdit={!!canEdit}
      />
    </div>
  );
}
