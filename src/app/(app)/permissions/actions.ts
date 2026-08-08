"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Feature } from "@/components/layout/nav-items";

export type ActionResult = { success: true } | { success: false; message: string };

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "42501") return "Bạn không có quyền sửa phân quyền.";
  return error.message;
}

export async function setUserPermission(
  userId: string,
  feature: Feature,
  level: "view" | "edit",
  value: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("user_permissions")
    .select("can_view, can_edit")
    .eq("user_id", userId)
    .eq("feature", feature)
    .maybeSingle();

  let canView = existing?.can_view ?? false;
  let canEdit = existing?.can_edit ?? false;

  if (level === "view") {
    canView = value;
    if (!value) canEdit = false;
  } else {
    canEdit = value;
    if (value) canView = true;
  }

  if (!canView && !canEdit) {
    const { error } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", userId)
      .eq("feature", feature);
    if (error) return { success: false, message: friendlyError(error) };
  } else {
    const { error } = await supabase.from("user_permissions").upsert(
      {
        user_id: userId,
        feature,
        can_view: canView,
        can_edit: canEdit,
        granted_by: user?.id,
        granted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feature" }
    );
    if (error) return { success: false, message: friendlyError(error) };
  }

  revalidatePath("/permissions");
  return { success: true };
}
