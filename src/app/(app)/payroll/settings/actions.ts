"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  globalSettingsFormSchema,
  rateSettingsFormSchema,
  type GlobalSettingsFormValues,
  type RateSettingsFormValues,
} from "@/lib/validation/payroll-settings.schema";

export type ActionResult = { success: true } | { success: false; message: string };

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Đã có cấu hình với ngày hiệu lực này.";
  if (error.code === "42501") return "Bạn không có quyền sửa cấu hình lương.";
  return error.message;
}

export async function createGlobalSettings(values: GlobalSettingsFormValues): Promise<ActionResult> {
  const parsed = globalSettingsFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payroll_global_settings").insert({
    ...parsed.data,
    created_by: user?.id,
  });

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/payroll/settings");
  return { success: true };
}

export async function deleteGlobalSettings(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("payroll_global_settings").delete().eq("id", id);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/payroll/settings");
  return { success: true };
}

export async function createRateSettings(values: RateSettingsFormValues): Promise<ActionResult> {
  const parsed = rateSettingsFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payroll_rate_settings").insert({
    ...parsed.data,
    created_by: user?.id,
  });

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/payroll/settings");
  return { success: true };
}

export async function deleteRateSettings(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("payroll_rate_settings").delete().eq("id", id);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/payroll/settings");
  return { success: true };
}
