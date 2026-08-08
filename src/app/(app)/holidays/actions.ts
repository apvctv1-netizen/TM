"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { holidayFormSchema, type HolidayFormValues } from "@/lib/validation/holiday.schema";

export type ActionResult = { success: true } | { success: false; message: string };

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Ngày này đã có trong danh sách ngày lễ.";
  if (error.code === "42501") return "Bạn không có quyền sửa danh mục ngày lễ.";
  return error.message;
}

export async function createHoliday(values: HolidayFormValues): Promise<ActionResult> {
  const parsed = holidayFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("holidays").insert({
    ...parsed.data,
    created_by: user?.id,
  });

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/holidays");
  return { success: true };
}

export async function updateHoliday(id: string, values: HolidayFormValues): Promise<ActionResult> {
  const parsed = holidayFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("holidays").update(parsed.data).eq("id", id);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/holidays");
  return { success: true };
}

export async function deleteHoliday(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("holidays").delete().eq("id", id);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/holidays");
  return { success: true };
}
