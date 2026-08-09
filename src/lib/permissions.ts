import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Feature } from "@/components/layout/nav-items";

// Lớp phòng vệ thứ hai ở tầng trang (redirect UX) — ranh giới bảo mật thật sự
// vẫn là RLS ở tầng DB (has_permission() được gọi lại y hệt trong policy).
// Không tự getUser() lại — mọi trang gọi hàm này đều nằm trong
// app/(app)/layout.tsx, layout đã redirect nếu chưa đăng nhập rồi, và
// getCurrentProfile() dùng chung cache() với layout nên gọi lại ở đây gần
// như miễn phí (không tốn thêm round-trip DB).
export async function requirePermission(
  feature: Feature,
  level: "view" | "edit" = "view"
) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_permission", {
    p_feature: feature,
    p_level: level,
  });

  if (!allowed) {
    redirect("/unauthorized");
  }
}

// Cho các trang chỉ admin được vào (Danh mục ca trực, Ngày Lễ/Tết...) — các
// bảng này không có feature trong user_permissions, RLS chặn write bằng
// current_role()='admin' trực tiếp, và current_role() chỉ đơn giản là
// `select role from profiles where id = auth.uid()` (xem migration
// 20260101000012) — tức đúng bằng profile.role đã có sẵn từ cache, nên dùng
// thẳng thay vì gọi RPC riêng.
export async function requireAdmin() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/unauthorized");
  }
}
