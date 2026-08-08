"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { success: true; periodId: string }
  | { success: false; message: string };

function friendlyCalcError(message: string): string {
  if (message.includes("insufficient_privilege")) return "Bạn không có quyền tính lương.";
  if (message.includes("period_is_locked")) return "Kỳ lương đã khoá — mở khoá trước khi tính lại.";
  if (message.includes("no_effective_payroll_settings_for_period"))
    return "Chưa có cấu hình lương (chung/đơn giá) có hiệu lực trước kỳ này. Hãy thêm ở trang Cấu hình lương.";
  return message;
}

export async function calculatePayrollPeriod(year: number, month: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("calculate_payroll_period", { p_year: year, p_month: month });

  if (error) return { success: false, message: friendlyCalcError(error.message) };

  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id")
    .eq("period_year", year)
    .eq("period_month", month)
    .single();

  if (!period) return { success: false, message: "Không tìm thấy kỳ lương sau khi tính." };

  revalidatePath("/payroll");
  revalidatePath(`/payroll/${period.id}`);
  return { success: true, periodId: period.id };
}

export type SimpleResult = { success: true } | { success: false; message: string };

export async function setPeriodLocked(periodId: string, locked: boolean): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("payroll_periods")
    .update({
      status: locked ? "locked" : "open",
      locked_at: locked ? new Date().toISOString() : null,
      locked_by: locked ? user?.id : null,
    })
    .eq("id", periodId);

  if (error) {
    if (error.code === "42501") return { success: false, message: "Bạn không có quyền khoá/mở kỳ lương." };
    return { success: false, message: error.message };
  }

  revalidatePath("/payroll");
  revalidatePath(`/payroll/${periodId}`);
  return { success: true };
}
