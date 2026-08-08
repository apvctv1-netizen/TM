import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { ImportWizard } from "@/components/personnel/import-wizard";

export default async function ImportEmployeesPage() {
  await requirePermission("personnel", "edit");

  const supabase = await createClient();
  const [{ data: partners }, { data: positions }, { data: employees }] = await Promise.all([
    supabase.from("partners").select("code, name").order("name"),
    supabase.from("positions").select("code, name").order("name"),
    supabase.from("employees").select("employee_code"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nhập nhân sự từ Excel</h1>
        <p className="text-sm text-muted-foreground">
          Chọn file Excel theo đúng layout sheet DSNS. Hệ thống sẽ kiểm tra và cho xem trước
          trước khi ghi vào hệ thống.
        </p>
      </div>
      <ImportWizard
        partnerCodes={(partners ?? []).map((p) => p.code)}
        positionCodes={(positions ?? []).map((p) => p.code)}
        existingEmployeeCodes={(employees ?? []).map((e) => e.employee_code)}
      />
    </div>
  );
}
