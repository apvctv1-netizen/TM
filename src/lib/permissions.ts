import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Feature } from "@/components/layout/nav-items";

// Lớp phòng vệ thứ hai ở tầng trang (redirect UX) — ranh giới bảo mật thật sự
// vẫn là RLS ở tầng DB (has_permission() được gọi lại y hệt trong policy).
export async function requirePermission(
  feature: Feature,
  level: "view" | "edit" = "view"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
// current_role()='admin' trực tiếp nên phòng vệ ở tầng trang cũng theo đúng
// điều kiện đó thay vì has_permission().
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase.rpc("current_role");

  if (role !== "admin") {
    redirect("/unauthorized");
  }
}
