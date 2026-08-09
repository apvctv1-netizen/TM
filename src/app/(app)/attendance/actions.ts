"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; message: string };

export async function setAttendanceDay(
  employeeId: string,
  workDate: string,
  shiftTypeIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_attendance_day", {
    p_employee_id: employeeId,
    p_work_date: workDate,
    p_shift_type_ids: shiftTypeIds,
  });

  if (error) {
    if (error.message?.includes("insufficient_privilege")) {
      return { success: false, message: "Bạn không có quyền sửa chấm công." };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/attendance");
  return { success: true };
}

// Ghi chú gắn theo (employee_id, work_date) — áp lên mọi dòng attendance_entries
// của ngày đó (1 ngày có thể có 2 dòng nếu chọn 2 ca), vì cột note đã có sẵn
// trên attendance_entries chứ không có bảng riêng. Nếu ngày đó chưa chấm công
// (chưa có dòng nào) thì không có chỗ lưu — báo lỗi rõ ràng thay vì lặng lẽ
// mất ghi chú.
export async function setAttendanceNote(
  employeeId: string,
  workDate: string,
  note: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const trimmed = note.trim();

  const { data, error } = await supabase
    .from("attendance_entries")
    .update({ note: trimmed === "" ? null : trimmed })
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .select("id");

  if (error) {
    if (error.message?.includes("insufficient_privilege") || error.code === "42501") {
      return { success: false, message: "Bạn không có quyền sửa ghi chú chấm công." };
    }
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: "Chưa chấm công ngày này — hãy chọn ca trước khi thêm ghi chú." };
  }

  revalidatePath("/attendance");
  revalidatePath("/payroll");
  return { success: true };
}
