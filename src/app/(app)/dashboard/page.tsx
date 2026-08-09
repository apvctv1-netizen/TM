import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CalendarCheck, Wallet, CalendarDays, ReceiptText, ArrowRight, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const numberFmt = new Intl.NumberFormat("vi-VN");

const PERIOD_STATUS_LABEL: Record<string, string> = {
  open: "Đang mở",
  locked: "Đã khoá",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const role = profile.role ?? "employee";

  const header = (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Trang chủ</h1>
      <p className="text-sm text-muted-foreground">Xin chào, {profile.full_name ?? profile.email}</p>
    </div>
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${pad2(month)}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad2(month)}-${pad2(daysInMonth)}`;

  if (role === "employee") {
    if (!profile?.employee_id) {
      return (
        <div className="flex flex-col gap-4">
          {header}
          <Empty className="rounded-xl border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutDashboard />
              </EmptyMedia>
              <EmptyTitle>Tài khoản chưa gắn với hồ sơ nhân viên</EmptyTitle>
              <EmptyDescription>Liên hệ quản trị viên để được gắn hồ sơ nhân viên.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      );
    }

    const [{ count: congThangNay }, { data: latestPayslip }] = await Promise.all([
      supabase
        .from("attendance_entries")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", profile.employee_id)
        .gte("work_date", monthStart)
        .lte("work_date", monthEnd),
      supabase
        .from("payroll_entries")
        .select("tong_luong_nhan, payroll_periods!inner(period_year, period_month, status)")
        .eq("employee_id", profile.employee_id)
        .eq("payroll_periods.status", "locked")
        .order("period_year", { referencedTable: "payroll_periods", ascending: false })
        .order("period_month", { referencedTable: "payroll_periods", ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/me/attendance">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <CalendarDays className="size-4" /> Lịch công của tôi
                </CardDescription>
                <CardTitle className="text-2xl">{congThangNay ?? 0} ngày công</CardTitle>
                <CardAction>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Trong tháng {month}/{year}
              </CardContent>
            </Card>
          </Link>

          <Link href="/me/payslips">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <ReceiptText className="size-4" /> Phiếu lương gần nhất
                </CardDescription>
                <CardTitle className="text-2xl">
                  {latestPayslip ? numberFmt.format(latestPayslip.tong_luong_nhan) : "Chưa có"}
                </CardTitle>
                <CardAction>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {latestPayslip
                  ? (() => {
                      const p = latestPayslip.payroll_periods as unknown as {
                        period_year: number;
                        period_month: number;
                      };
                      return `Tháng ${p.period_month}/${p.period_year}`;
                    })()
                  : "Chưa có kỳ lương nào được khoá"}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = role === "admin";
  const [personnelOk, attendanceOk, payrollOk] = isAdmin
    ? [true, true, true]
    : await Promise.all([
        supabase.rpc("has_permission", { p_feature: "personnel", p_level: "view" }).then((r) => !!r.data),
        supabase.rpc("has_permission", { p_feature: "attendance", p_level: "view" }).then((r) => !!r.data),
        supabase.rpc("has_permission", { p_feature: "payroll", p_level: "view" }).then((r) => !!r.data),
      ]);

  const [personnelCount, attendanceCount, latestPeriod] = await Promise.all([
    personnelOk
      ? supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .or(`end_date.is.null,end_date.gte.${monthStart}`)
          .then((r) => r.count)
      : Promise.resolve(null),
    attendanceOk
      ? supabase
          .from("attendance_entries")
          .select("id", { count: "exact", head: true })
          .gte("work_date", monthStart)
          .lte("work_date", monthEnd)
          .then((r) => r.count)
      : Promise.resolve(null),
    payrollOk
      ? supabase
          .from("payroll_periods")
          .select("id, period_year, period_month, status")
          .order("period_year", { ascending: false })
          .order("period_month", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  if (!personnelOk && !attendanceOk && !payrollOk) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutDashboard />
            </EmptyMedia>
            <EmptyTitle>Bạn chưa được cấp quyền truy cập module nào</EmptyTitle>
            <EmptyDescription>Liên hệ quản trị viên để được cấp quyền.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personnelOk && (
          <Link href="/personnel">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Users className="size-4" /> Nhân viên đang làm việc
                </CardDescription>
                <CardTitle className="text-2xl">{personnelCount ?? 0}</CardTitle>
                <CardAction>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Xem danh sách Nhân sự</CardContent>
            </Card>
          </Link>
        )}

        {attendanceOk && (
          <Link href="/attendance">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <CalendarCheck className="size-4" /> Lượt chấm công tháng này
                </CardDescription>
                <CardTitle className="text-2xl">{attendanceCount ?? 0}</CardTitle>
                <CardAction>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tháng {month}/{year}
              </CardContent>
            </Card>
          </Link>
        )}

        {payrollOk && (
          <Link href={latestPeriod ? `/payroll/${latestPeriod.id}` : "/payroll"}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Wallet className="size-4" /> Kỳ lương gần nhất
                </CardDescription>
                <CardTitle className="text-2xl">
                  {latestPeriod ? `${latestPeriod.period_month}/${latestPeriod.period_year}` : "Chưa có"}
                </CardTitle>
                <CardAction>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {latestPeriod ? (
                  <Badge variant={latestPeriod.status === "locked" ? "outline" : "secondary"}>
                    {PERIOD_STATUS_LABEL[latestPeriod.status] ?? latestPeriod.status}
                  </Badge>
                ) : (
                  "Chưa tính kỳ lương nào"
                )}
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
