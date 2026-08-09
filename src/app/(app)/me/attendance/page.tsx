import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CalendarDays } from "lucide-react";
import { MyAttendanceCalendar } from "@/components/me/my-attendance-calendar";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function MyAttendancePage(props: PageProps<"/me/attendance">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const sp = await props.searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEnd = `${year}-${pad2(month)}-${pad2(daysInMonth)}`;

  const supabase = await createClient();

  const [{ data: employee }, { data: entries }, { data: shiftTypes }, { data: holidays }] = await Promise.all([
    profile.employee_id
      ? supabase.from("employees").select("full_name").eq("id", profile.employee_id).maybeSingle()
      : Promise.resolve({ data: null }),
    profile.employee_id
      ? supabase
          .from("attendance_entries")
          .select("work_date, shift_type_id")
          .eq("employee_id", profile.employee_id)
          .gte("work_date", monthStart)
          .lte("work_date", monthEnd)
      : Promise.resolve({ data: null }),
    supabase.from("shift_types").select("id, code, label, parent_group").order("sort_order", { ascending: true }),
    supabase.from("holidays").select("holiday_date").gte("holiday_date", monthStart).lte("holiday_date", monthEnd),
  ]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lịch công của tôi</h1>
        <p className="text-sm text-muted-foreground">{employee?.full_name ?? ""}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/me/attendance?year=${prevMonth.year}&month=${prevMonth.month}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <span className="min-w-32 text-center text-sm font-medium">
          Tháng {month}/{year}
        </span>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/me/attendance?year=${nextMonth.year}&month=${nextMonth.month}`}>
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );

  if (!profile.employee_id) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Tài khoản chưa gắn với hồ sơ nhân viên</EmptyTitle>
            <EmptyDescription>Liên hệ quản trị viên để được gắn hồ sơ nhân viên.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      <MyAttendanceCalendar
        year={year}
        month={month}
        daysInMonth={daysInMonth}
        entries={entries ?? []}
        shiftTypes={shiftTypes ?? []}
        holidayDates={(holidays ?? []).map((h) => h.holiday_date)}
      />
    </div>
  );
}
