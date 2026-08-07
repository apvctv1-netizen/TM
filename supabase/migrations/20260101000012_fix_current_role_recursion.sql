-- Sửa lỗi đệ quy vô hạn (phát hiện qua kiểm thử RLS thực tế, không phải lý
-- thuyết): `current_role()` ban đầu là SECURITY INVOKER và tự đọc
-- `public.profiles`. Nhưng `profiles` có policy `profiles_select_admin`/
-- `profiles_write_admin` gọi lại `public.current_role()` — khi Postgres
-- không short-circuit được nhánh OR của 2 policy (`profiles_select_self OR
-- profiles_select_admin`) cho một hàng bất kỳ, nó gọi lại current_role(),
-- hàm này lại tự SELECT từ profiles, lại kích hoạt RLS, lại gọi
-- current_role()... → "stack depth limit exceeded". Giả định ban đầu
-- ("SECURITY INVOKER, chỉ đọc dòng của chính user nên không đệ quy") sai vì
-- không tính đến việc chính bảng profiles cũng bị RLS chi phối khi hàm này
-- đọc nó.
--
-- Fix: đổi current_role() sang SECURITY DEFINER — hàm chạy dưới quyền chủ sở
-- hữu (postgres, superuser), bỏ qua RLS khi tự tra profiles, nên việc gọi lại
-- current_role() từ bất kỳ policy nào (profiles, employees, payroll_periods…)
-- không còn kích hoạt vòng lặp nữa. Hàm vẫn chỉ trả về đúng role của
-- auth.uid() hiện tại (an toàn, không phải lỗ hổng leo quyền) vì điều kiện
-- lọc theo auth.uid() vẫn nằm trong thân hàm, SECURITY DEFINER chỉ bỏ qua
-- RLS chứ không bỏ qua điều kiện WHERE.

create or replace function public.current_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;
revoke all on function public.current_role() from public;
grant execute on function public.current_role() to authenticated;
