import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { UserTable } from "@/components/users/user-table";

export default async function UsersPage() {
  await requireAdmin();

  const supabase = await createClient();

  const [{ data: profiles }, { data: employees }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_id, is_active")
      .order("full_name", { ascending: true }),
    supabase.from("employees").select("id, employee_code, full_name").order("employee_code", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Mời tài khoản đăng nhập, gắn với hồ sơ Nhân viên và quản lý trạng thái hoạt động.
        </p>
      </div>
      <UserTable profiles={profiles ?? []} employees={employees ?? []} />
    </div>
  );
}
