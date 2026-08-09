import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { DemoDataPanel } from "@/components/demo-data/demo-data-panel";

export default async function DemoDataPage() {
  await requireAdmin();

  const supabase = await createClient();
  const [{ count: employeeCount }, { count: demoCount }] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("note", "[DEMO]"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dữ liệu demo</h1>
        <p className="text-sm text-muted-foreground">
          Tạo nhanh dữ liệu giả (nhân sự, chấm công, ngày lễ, cấu hình lương, bảng lương) để xem
          thử toàn bộ app đã chạy hoàn chỉnh chưa, trước khi nhập dữ liệu thật.
        </p>
      </div>
      <DemoDataPanel employeeCount={employeeCount ?? 0} demoEmployeeCount={demoCount ?? 0} />
    </div>
  );
}
