import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/components/personnel/employee-table";

export default async function PersonnelPage() {
  await requirePermission("personnel", "view");

  const supabase = await createClient();

  const [{ data: employees }, { data: partners }, { data: positions }, { data: canEdit }] =
    await Promise.all([
      supabase
        .from("employees")
        .select(
          "id, employee_code, full_name, start_date, end_date, phone, email, contract_type, partner_code, position_code"
        )
        .order("employee_code", { ascending: true }),
      supabase.from("partners").select("code, name").order("name"),
      supabase.from("positions").select("code, name").order("name"),
      supabase.rpc("has_permission", { p_feature: "personnel", p_level: "edit" }),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nhân sự</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách nhân sự, hồ sơ và trạng thái hợp đồng.
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/personnel/import">
                <Upload data-icon="inline-start" />
                Nhập từ Excel
              </Link>
            </Button>
            <Button asChild>
              <Link href="/personnel/new">
                <Plus data-icon="inline-start" />
                Thêm nhân sự
              </Link>
            </Button>
          </div>
        )}
      </div>

      <EmployeeTable
        employees={employees ?? []}
        partners={partners ?? []}
        positions={positions ?? []}
        canEdit={!!canEdit}
      />
    </div>
  );
}
