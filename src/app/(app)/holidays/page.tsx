import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { HolidayTable } from "@/components/holidays/holiday-table";

export default async function HolidaysPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: holidays } = await supabase
    .from("holidays")
    .select("*")
    .order("holiday_date", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ngày Lễ / Tết</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách ngày lễ dùng để tính công làm ngày Lễ/Tết khi tổng hợp lương.
        </p>
      </div>
      <HolidayTable holidays={holidays ?? []} />
    </div>
  );
}
