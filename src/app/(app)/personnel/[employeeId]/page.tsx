import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { EmployeeForm } from "@/components/personnel/employee-form";

export default async function EmployeeDetailPage(props: PageProps<"/personnel/[employeeId]">) {
  await requirePermission("personnel", "view");

  const { employeeId } = await props.params;
  const supabase = await createClient();

  const [{ data: employee }, { data: partners }, { data: positions }, { data: canEdit }] =
    await Promise.all([
      supabase.from("employees").select("*").eq("id", employeeId).maybeSingle(),
      supabase.from("partners").select("code, name").order("name"),
      supabase.from("positions").select("code, name").order("name"),
      supabase.rpc("has_permission", { p_feature: "personnel", p_level: "edit" }),
    ]);

  if (!employee) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {employee.full_name} <span className="text-muted-foreground">— #{employee.employee_code}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {canEdit ? "Chỉnh sửa hồ sơ nhân sự." : "Xem hồ sơ nhân sự (không có quyền sửa)."}
        </p>
      </div>
      <EmployeeForm
        employee={employee}
        partners={partners ?? []}
        positions={positions ?? []}
        readOnly={!canEdit}
      />
    </div>
  );
}
