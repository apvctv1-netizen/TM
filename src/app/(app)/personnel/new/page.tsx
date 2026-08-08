import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { EmployeeForm } from "@/components/personnel/employee-form";

export default async function NewEmployeePage() {
  await requirePermission("personnel", "edit");

  const supabase = await createClient();
  const [{ data: partners }, { data: positions }] = await Promise.all([
    supabase.from("partners").select("code, name").order("name"),
    supabase.from("positions").select("code, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thêm nhân sự</h1>
        <p className="text-sm text-muted-foreground">Nhập hồ sơ nhân sự mới.</p>
      </div>
      <EmployeeForm partners={partners ?? []} positions={positions ?? []} />
    </div>
  );
}
