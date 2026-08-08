-- RPC nhập hàng loạt Nhân sự từ Excel (sheet DSNS). SECURITY INVOKER (không
-- phải DEFINER) — khác với calculate_payroll_period — vì ở đây không có nhu
-- cầu đọc chéo module như payroll cần đọc attendance; để INSERT/UPDATE bên
-- trong tự chịu RLS của employees (employees_insert/employees_update, đã yêu
-- cầu has_permission('personnel','edit')) làm lớp phòng vệ kép, giống cách
-- set_attendance_day đã làm: vừa tự kiểm tra has_permission() ở đầu hàm, vừa
-- để RLS chặn lại nếu có gọi thẳng RPC mà bỏ qua kiểm tra ở tầng ứng dụng.
--
-- Xử lý lỗi theo từng dòng (không phải toàn bộ transaction all-or-nothing):
-- mỗi phần tử jsonb được insert/update trong khối BEGIN...EXCEPTION riêng,
-- lỗi (vd partner_code không tồn tại trong danh mục → vi phạm FK) được bắt và
-- trả về trong cột error_message thay vì làm rollback toàn bộ lô, để UI hiện
-- "đã nhập X, cập nhật Y, lỗi Z" đúng như thiết kế.

create or replace function public.upsert_employees_bulk(p_rows jsonb)
returns table (employee_code integer, action text, error_message text)
language plpgsql security invoker set search_path = public as $$
declare
  v_row jsonb;
  v_employee_code integer;
  v_existed boolean;
begin
  if not public.has_permission('personnel', 'edit') then
    raise exception 'insufficient_privilege: personnel edit permission required';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    begin
      v_employee_code := (v_row->>'employee_code')::integer;
      select exists(
        select 1 from public.employees e where e.employee_code = v_employee_code
      ) into v_existed;

      insert into public.employees (
        employee_code, full_name, start_date, end_date, gender, dob,
        id_number, id_issue_date, id_issue_place, permanent_address,
        phone, email, education_level, partner_code, position_code,
        contract_type, note, created_by, updated_by
      ) values (
        v_employee_code,
        v_row->>'full_name',
        (v_row->>'start_date')::date,
        nullif(v_row->>'end_date', '')::date,
        nullif(v_row->>'gender', ''),
        nullif(v_row->>'dob', '')::date,
        nullif(v_row->>'id_number', ''),
        nullif(v_row->>'id_issue_date', '')::date,
        nullif(v_row->>'id_issue_place', ''),
        nullif(v_row->>'permanent_address', ''),
        nullif(v_row->>'phone', ''),
        nullif(v_row->>'email', ''),
        nullif(v_row->>'education_level', ''),
        nullif(v_row->>'partner_code', ''),
        nullif(v_row->>'position_code', ''),
        coalesce(nullif(v_row->>'contract_type', ''), 'TV'),
        nullif(v_row->>'note', ''),
        auth.uid(),
        auth.uid()
      )
      on conflict (employee_code) do update set
        full_name = excluded.full_name,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        gender = excluded.gender,
        dob = excluded.dob,
        id_number = excluded.id_number,
        id_issue_date = excluded.id_issue_date,
        id_issue_place = excluded.id_issue_place,
        permanent_address = excluded.permanent_address,
        phone = excluded.phone,
        email = excluded.email,
        education_level = excluded.education_level,
        partner_code = excluded.partner_code,
        position_code = excluded.position_code,
        contract_type = excluded.contract_type,
        note = excluded.note,
        updated_at = now(),
        updated_by = auth.uid();

      employee_code := v_employee_code;
      action := case when v_existed then 'updated' else 'inserted' end;
      error_message := null;
      return next;
    exception when others then
      employee_code := v_employee_code;
      action := 'error';
      error_message := sqlerrm;
      return next;
    end;
  end loop;
end;
$$;

revoke all on function public.upsert_employees_bulk(jsonb) from public;
grant execute on function public.upsert_employees_bulk(jsonb) to authenticated;
