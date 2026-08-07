-- Bật RLS và policy cho toàn bộ bảng. has_permission() đã tự bao gồm
-- trường hợp admin (xem 20260101000006), nên các policy dùng has_permission()
-- không cần thêm điều kiện "or current_role() = 'admin'" riêng.

-- ============ profiles / user_permissions (chỉ admin quản lý) ============
-- Quy tắc bắt buộc: KHÔNG gọi has_permission() từ policy của 2 bảng này,
-- vì has_permission() đọc chính 2 bảng này ⇒ sẽ đệ quy vô hạn.

alter table public.profiles enable row level security;

create policy profiles_select_self on public.profiles
  for select to authenticated
  using ( id = auth.uid() );

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using ( public.current_role() = 'admin' );

create policy profiles_write_admin on public.profiles
  for all to authenticated
  using ( public.current_role() = 'admin' )
  with check ( public.current_role() = 'admin' );

alter table public.user_permissions enable row level security;

create policy user_permissions_select_self on public.user_permissions
  for select to authenticated
  using ( user_id = auth.uid() );

create policy user_permissions_write_admin on public.user_permissions
  for all to authenticated
  using ( public.current_role() = 'admin' )
  with check ( public.current_role() = 'admin' );

-- ============ Danh mục dùng chung: đọc cho mọi user đã đăng nhập (không ============
-- ============ chứa dữ liệu nhạy cảm), chỉ admin được sửa. ============

alter table public.partners enable row level security;
create policy partners_select_all on public.partners for select to authenticated using ( true );
create policy partners_write_admin on public.partners for all to authenticated
  using ( public.current_role() = 'admin' ) with check ( public.current_role() = 'admin' );

alter table public.positions enable row level security;
create policy positions_select_all on public.positions for select to authenticated using ( true );
create policy positions_write_admin on public.positions for all to authenticated
  using ( public.current_role() = 'admin' ) with check ( public.current_role() = 'admin' );

alter table public.shift_types enable row level security;
create policy shift_types_select_all on public.shift_types for select to authenticated using ( true );
create policy shift_types_write_admin on public.shift_types for all to authenticated
  using ( public.current_role() = 'admin' ) with check ( public.current_role() = 'admin' );

alter table public.holidays enable row level security;
create policy holidays_select_all on public.holidays for select to authenticated using ( true );
create policy holidays_write_admin on public.holidays for all to authenticated
  using ( public.current_role() = 'admin' ) with check ( public.current_role() = 'admin' );

-- ============ employees (feature = 'personnel') ============

alter table public.employees enable row level security;

create policy employees_select_module on public.employees for select to authenticated
  using ( public.has_permission('personnel','view') );
create policy employees_select_self on public.employees for select to authenticated
  using ( id = (select employee_id from public.profiles where id = auth.uid()) );
create policy employees_insert on public.employees for insert to authenticated
  with check ( public.has_permission('personnel','edit') );
create policy employees_update on public.employees for update to authenticated
  using ( public.has_permission('personnel','edit') ) with check ( public.has_permission('personnel','edit') );
create policy employees_delete on public.employees for delete to authenticated
  using ( public.has_permission('personnel','edit') );

-- ============ attendance_entries (feature = 'attendance') ============
-- Nhân viên xem "lịch công" của chính mình không bị chặn bởi trạng thái khoá
-- kỳ lương — attendance là dữ liệu nguồn, không phải bảng lương đã chốt.

alter table public.attendance_entries enable row level security;

create policy attendance_entries_select_module on public.attendance_entries for select to authenticated
  using ( public.has_permission('attendance','view') );
create policy attendance_entries_select_self on public.attendance_entries for select to authenticated
  using ( employee_id = (select employee_id from public.profiles where id = auth.uid()) );
create policy attendance_entries_insert on public.attendance_entries for insert to authenticated
  with check ( public.has_permission('attendance','edit') );
create policy attendance_entries_update on public.attendance_entries for update to authenticated
  using ( public.has_permission('attendance','edit') ) with check ( public.has_permission('attendance','edit') );
create policy attendance_entries_delete on public.attendance_entries for delete to authenticated
  using ( public.has_permission('attendance','edit') );

-- ============ payroll_global_settings / payroll_rate_settings (feature = 'payroll_settings') ============

alter table public.payroll_global_settings enable row level security;
create policy payroll_global_settings_select on public.payroll_global_settings for select to authenticated
  using ( public.has_permission('payroll_settings','view') );
create policy payroll_global_settings_insert on public.payroll_global_settings for insert to authenticated
  with check ( public.has_permission('payroll_settings','edit') );
create policy payroll_global_settings_update on public.payroll_global_settings for update to authenticated
  using ( public.has_permission('payroll_settings','edit') ) with check ( public.has_permission('payroll_settings','edit') );
create policy payroll_global_settings_delete on public.payroll_global_settings for delete to authenticated
  using ( public.current_role() = 'admin' );

alter table public.payroll_rate_settings enable row level security;
create policy payroll_rate_settings_select on public.payroll_rate_settings for select to authenticated
  using ( public.has_permission('payroll_settings','view') );
create policy payroll_rate_settings_insert on public.payroll_rate_settings for insert to authenticated
  with check ( public.has_permission('payroll_settings','edit') );
create policy payroll_rate_settings_update on public.payroll_rate_settings for update to authenticated
  using ( public.has_permission('payroll_settings','edit') ) with check ( public.has_permission('payroll_settings','edit') );
create policy payroll_rate_settings_delete on public.payroll_rate_settings for delete to authenticated
  using ( public.current_role() = 'admin' );

-- ============ payroll_periods ============
-- Không chứa số tiền, chỉ là nhãn kỳ/trạng thái khoá — đọc mở cho mọi user đã
-- đăng nhập để policy tự-xem của payroll_entries (bên dưới) có thể kiểm tra
-- được pp.status='locked' cho chính nhân viên đó (RLS áp dụng cho cả subquery
-- lồng trong policy của bảng khác). Insert chỉ thực hiện qua RPC
-- calculate_payroll_period (SECURITY DEFINER, bỏ qua RLS).

alter table public.payroll_periods enable row level security;
create policy payroll_periods_select_all on public.payroll_periods for select to authenticated using ( true );
create policy payroll_periods_update on public.payroll_periods for update to authenticated
  using ( public.has_permission('payroll','edit') ) with check ( public.has_permission('payroll','edit') );
create policy payroll_periods_insert_admin on public.payroll_periods for insert to authenticated
  with check ( public.current_role() = 'admin' );
create policy payroll_periods_delete_admin on public.payroll_periods for delete to authenticated
  using ( public.current_role() = 'admin' );

-- ============ payroll_entries (feature = 'payroll') ============
-- Nhân viên chỉ xem được kỳ ĐÃ KHOÁ của chính mình. HR/admin không sửa được
-- kỳ đã khoá (enforce ở DB, không chỉ disable nút UI).

alter table public.payroll_entries enable row level security;

create policy payroll_entries_select_module on public.payroll_entries for select to authenticated
  using ( public.has_permission('payroll','view') );
create policy payroll_entries_select_self on public.payroll_entries for select to authenticated
  using ( employee_id = (select employee_id from public.profiles where id = auth.uid())
    and exists (select 1 from public.payroll_periods pp where pp.id = period_id and pp.status = 'locked') );
create policy payroll_entries_update on public.payroll_entries for update to authenticated
  using ( public.has_permission('payroll','edit')
    and not exists (select 1 from public.payroll_periods pp where pp.id = period_id and pp.status = 'locked') )
  with check ( public.has_permission('payroll','edit') );
create policy payroll_entries_insert_admin on public.payroll_entries for insert to authenticated
  with check ( public.current_role() = 'admin' );
create policy payroll_entries_delete_admin on public.payroll_entries for delete to authenticated
  using ( public.current_role() = 'admin' );
