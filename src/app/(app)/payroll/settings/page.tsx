import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions";
import { GlobalSettingsSection } from "@/components/payroll-settings/global-settings-section";
import { RateSettingsSection } from "@/components/payroll-settings/rate-settings-section";

export default async function PayrollSettingsPage() {
  await requirePermission("payroll_settings", "view");

  const supabase = await createClient();

  const [{ data: globalSettings }, { data: rateSettings }, { data: canEdit }] = await Promise.all([
    supabase.from("payroll_global_settings").select("*").order("effective_from", { ascending: false }),
    supabase.from("payroll_rate_settings").select("*").order("effective_from", { ascending: false }),
    supabase.rpc("has_permission", { p_feature: "payroll_settings", p_level: "edit" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cấu hình lương</h1>
        <p className="text-sm text-muted-foreground">
          Các mốc cấu hình có hiệu lực theo ngày — bảng lương đã tính giữ nguyên số dù cấu hình sau này
          thay đổi.
        </p>
      </div>
      <GlobalSettingsSection settings={globalSettings ?? []} canEdit={!!canEdit} />
      <RateSettingsSection settings={rateSettings ?? []} canEdit={!!canEdit} />
    </div>
  );
}
