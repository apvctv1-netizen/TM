-- Hàm helper cho RLS. SECURITY INVOKER + chỉ đọc dòng của chính user gọi hàm
-- (profiles.id = auth.uid(), user_permissions.user_id = auth.uid()) nên không
-- có nguy cơ đệ quy khi được gọi từ policy của chính hai bảng đó — bản thân
-- các policy của profiles/user_permissions KHÔNG được gọi has_permission().

create or replace function public.current_role() returns text
language sql security invoker stable set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.has_permission(p_feature text, p_level text default 'view') returns boolean
language sql security invoker stable set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or exists (select 1 from public.user_permissions up where up.user_id = auth.uid()
      and up.feature = p_feature
      and ((p_level = 'view' and up.can_view) or (p_level = 'edit' and up.can_edit))), false);
$$;

revoke all on function public.current_role() from public;
revoke all on function public.has_permission(text, text) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.has_permission(text, text) to authenticated;
