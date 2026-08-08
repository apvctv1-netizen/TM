import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { PermissionsMatrix } from "@/components/permissions/permissions-matrix";

export default async function PermissionsPage() {
  await requireAdmin();

  const supabase = await createClient();

  const { data: hrUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active")
    .eq("role", "hr")
    .order("full_name", { ascending: true });

  const userIds = (hrUsers ?? []).map((u) => u.id);

  const { data: permissions } =
    userIds.length > 0
      ? await supabase.from("user_permissions").select("*").in("user_id", userIds)
      : { data: [] };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Phân quyền</h1>
        <p className="text-sm text-muted-foreground">
          Cấp quyền xem/sửa từng chức năng cho tài khoản HR. Admin luôn có toàn quyền.
        </p>
      </div>
      <PermissionsMatrix hrUsers={hrUsers ?? []} permissions={permissions ?? []} />
    </div>
  );
}
