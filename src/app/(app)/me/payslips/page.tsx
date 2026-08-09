import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Wallet } from "lucide-react";
import { MyPayslipsList } from "@/components/me/my-payslips-list";

export default async function MyPayslipsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const [{ data: employee }, { data: entries }] = await Promise.all([
    profile.employee_id
      ? supabase.from("employees").select("full_name").eq("id", profile.employee_id).maybeSingle()
      : Promise.resolve({ data: null }),
    profile.employee_id
      ? supabase
          .from("payroll_entries")
          .select("*, payroll_periods!inner(period_year, period_month, status)")
          .eq("employee_id", profile.employee_id)
          .eq("payroll_periods.status", "locked")
      : Promise.resolve({ data: null }),
  ]);

  const header = (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Bảng lương của tôi</h1>
      <p className="text-sm text-muted-foreground">{employee?.full_name ?? ""}</p>
    </div>
  );

  if (!profile.employee_id) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>Tài khoản chưa gắn với hồ sơ nhân viên</EmptyTitle>
            <EmptyDescription>Liên hệ quản trị viên để được gắn hồ sơ nhân viên.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const sorted = (entries ?? []).sort((a, b) => {
    const pa = a.payroll_periods as unknown as { period_year: number; period_month: number };
    const pb = b.payroll_periods as unknown as { period_year: number; period_month: number };
    if (pa.period_year !== pb.period_year) return pb.period_year - pa.period_year;
    return pb.period_month - pa.period_month;
  });

  return (
    <div className="flex flex-col gap-4">
      {header}
      <MyPayslipsList entries={sorted} />
    </div>
  );
}
