"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  editUserFormSchema,
  inviteUserFormSchema,
  type EditUserFormValues,
  type InviteUserFormValues,
} from "@/lib/validation/user.schema";

export type ActionResult = { success: true } | { success: false; message: string };

async function assertAdmin(): Promise<ActionResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Bạn chưa đăng nhập." };

  const { data: role } = await supabase.rpc("current_role");
  if (role !== "admin") return { success: false, message: "Bạn không có quyền quản lý người dùng." };

  return null;
}

export async function inviteUser(values: InviteUserFormValues): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const parsed = inviteUserFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { email, full_name, role, employee_id } = parsed.data;
  const supabaseAdmin = createAdminClient();

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
  });

  if (inviteError) {
    if (inviteError.message?.toLowerCase().includes("already been registered") ||
        inviteError.message?.toLowerCase().includes("already registered")) {
      return { success: false, message: "Email này đã có tài khoản." };
    }
    return { success: false, message: inviteError.message };
  }

  if (!invited.user) {
    return { success: false, message: "Không thể tạo tài khoản." };
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ full_name, role, employee_id: employee_id || null })
    .eq("id", invited.user.id);

  if (profileError) {
    return { success: false, message: `Đã gửi lời mời nhưng lưu hồ sơ lỗi: ${profileError.message}` };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserProfile(userId: string, values: EditUserFormValues): Promise<ActionResult> {
  const parsed = editUserFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      employee_id: parsed.data.employee_id || null,
    })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") return { success: false, message: "Nhân viên này đã gắn với tài khoản khác." };
    if (error.code === "42501") return { success: false, message: "Bạn không có quyền sửa người dùng." };
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);

  if (error) {
    if (error.code === "42501") return { success: false, message: "Bạn không có quyền sửa người dùng." };
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}
