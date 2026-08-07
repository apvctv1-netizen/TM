-- Sửa lỗi: `supabase.auth.admin.createUser`/`updateUserById` ghi
-- raw_app_meta_data bằng một câu UPDATE riêng SAU câu INSERT ban đầu (INSERT
-- ban đầu chưa có role/full_name) — nếu trigger chỉ bắt AFTER INSERT thì
-- profile luôn bị tạo với role mặc định 'employee' sai, bất kể role thật đã
-- truyền vào app_metadata lúc gọi API. Sửa bằng cách: (1) bắt thêm
-- AFTER UPDATE OF raw_app_meta_data, (2) upsert on conflict thay vì chỉ
-- insert, (3) khi update chỉ ghi đè role/full_name nếu key đó THỰC SỰ có
-- trong app_metadata lần này (giữ nguyên giá trị cũ nếu không), tránh việc
-- một update app_metadata không liên quan (vd thêm provider khác) vô tình
-- reset role về mặc định.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_app_meta_data->>'full_name', new.email),
    coalesce(new.raw_app_meta_data->>'role', 'employee')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(new.raw_app_meta_data->>'full_name', public.profiles.full_name),
    role = coalesce(new.raw_app_meta_data->>'role', public.profiles.role),
    updated_at = now();
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function public.handle_new_user();
