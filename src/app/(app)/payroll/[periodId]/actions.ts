"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { payrollEntryFormSchema, type PayrollEntryFormValues } from "@/lib/validation/payroll-entry.schema";

export type ActionResult = { success: true } | { success: false; message: string };

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "42501") return "Bạn không có quyền sửa bảng lương, hoặc kỳ lương đã khoá.";
  return error.message;
}

export async function updatePayrollEntry(
  entryId: string,
  periodId: string,
  values: PayrollEntryFormValues
): Promise<ActionResult> {
  const parsed = payrollEntryFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("payroll_entries")
    .update({ ...parsed.data, updated_by: user?.id })
    .eq("id", entryId);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath(`/payroll/${periodId}`);
  return { success: true };
}
