"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { shiftTypeFormSchema, type ShiftTypeFormValues } from "@/lib/validation/shift-type.schema";

export type ActionResult = { success: true } | { success: false; message: string };

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Mã ca trực này đã tồn tại.";
  if (error.code === "42501") return "Bạn không có quyền sửa danh mục ca trực.";
  return error.message;
}

export async function createShiftType(values: ShiftTypeFormValues): Promise<ActionResult> {
  const parsed = shiftTypeFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shift_types").insert({
    ...parsed.data,
    time_range: parsed.data.time_range || null,
  });

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/shift-types");
  return { success: true };
}

export async function updateShiftType(id: string, values: ShiftTypeFormValues): Promise<ActionResult> {
  const parsed = shiftTypeFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shift_types")
    .update({ ...parsed.data, time_range: parsed.data.time_range || null })
    .eq("id", id);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/shift-types");
  return { success: true };
}

export async function toggleShiftTypeActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("shift_types").update({ is_active: isActive }).eq("id", id);

  if (error) return { success: false, message: friendlyError(error) };

  revalidatePath("/shift-types");
  return { success: true };
}

export async function deleteShiftType(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("shift_types").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { success: false, message: "Không thể xoá — ca trực này đã được dùng trong chấm công." };
    }
    return { success: false, message: friendlyError(error) };
  }

  revalidatePath("/shift-types");
  return { success: true };
}
