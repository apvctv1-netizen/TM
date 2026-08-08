import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { ShiftTypeTable } from "@/components/shift-types/shift-type-table";

export default async function ShiftTypesPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: shiftTypes } = await supabase
    .from("shift_types")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Danh mục ca trực</h1>
        <p className="text-sm text-muted-foreground">
          Mã ca, khung giờ và hệ số quy đổi công dùng khi chấm công và tính lương.
        </p>
      </div>
      <ShiftTypeTable shiftTypes={shiftTypes ?? []} />
    </div>
  );
}
