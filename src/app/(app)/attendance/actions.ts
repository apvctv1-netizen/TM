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
