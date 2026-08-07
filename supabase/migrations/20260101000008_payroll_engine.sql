-- Trigger tính tiền: mọi cột "tiền" trong payroll_entries được tính từ các
-- cột công/đơn giá đã lưu trên CÙNG dòng. Công thức chỉ tồn tại một chỗ duy
-- nhất và tự chạy lại khi admin sửa tay một trường thủ công qua UPDATE
-- thường (không cần gọi lại RPC calculate_payroll_period).

create or replace function public.trg_payroll_entries_calc() returns trigger
language plpgsql security invoker as $$
begin
  new.luong_theo_ctt      := round(new.cong_chinh * new.don_gia_cong, 2);
  new.tien_tang_ca         := round(new.tang_ca * new.don_gia_tang_ca, 2);
  new.tien_truc_le_tet     := round(new.cong_truc_le_tet * new.don_gia_truc_le_tet, 2);
  new.tien_nghi_le_tet     := round(new.so_ngay_nghi_le_tet * new.don_gia_nghi_le_tet, 2);
  new.tien_ca_dem          := round(new.cong_ca_dem * new.don_gia_ca_dem, 2);
  new.tien_luong_che_do    := round(new.cong_che_do * new.don_gia_luong_che_do, 2);
  new.tien_phep_nam        := round(new.ngay_nghi_phep_nam * new.don_gia_phep_nam, 2);
  new.thuong_hoan_thanh    := case when new.ctt >= new.standard_cong then new.completion_bonus_amount else 0 end;
  new.thuong_khuyen_khich  := case when new.ctt > new.incentive_bonus_threshold_cong
                                    then round((new.ctt - new.incentive_bonus_threshold_cong) * new.incentive_bonus_rate, 2)
                                    else 0 end;
  new.ho_tro_an_giua_ca    := round(least(new.ctt, new.standard_cong) * new.meal_allowance_rate, 2);
  new.tien_thuong_cght_knn := round(new.cght_knn * new.cght_knn_rate, 2);
  new.tong_luong := new.luong_theo_ctt + new.tien_tang_ca + new.tien_truc_le_tet + new.tien_nghi_le_tet
    + new.tien_ca_dem + new.tien_luong_che_do + new.tien_trach_nhiem + new.tien_phep_nam
    + new.thuong_hoan_thanh + new.thuong_khuyen_khich + new.ho_tro_an_giua_ca
    + new.tien_thuong_cght_knn + new.tien_hoc_viec + new.bo_sung_luong;
  new.tong_khau_tru := new.tru_bhxh + new.thu_ho + new.thue_tncn + new.truy_thu;
  new.tong_luong_nhan := round(new.tong_luong - new.tong_khau_tru, 0);
  new.updated_at := now();
  return new;
end; $$;

create trigger payroll_entries_calc before insert or update on public.payroll_entries
  for each row execute function public.trg_payroll_entries_calc();

-- RPC tính lương cả kỳ. SECURITY DEFINER là ngoại lệ duy nhất trong schema:
-- một HR có thể được cấp payroll:edit mà không có attendance:view — nếu chạy
-- dưới SECURITY INVOKER, việc đọc attendance_entries bên trong hàm sẽ bị RLS
-- lọc về 0 dòng (không báo lỗi, sai kết quả). Đổi lại, hàm tự kiểm tra
-- has_permission('payroll','edit') làm bước đầu tiên và bị revoke khỏi
-- PUBLIC/anon, chỉ grant cho authenticated.
create or replace function public.calculate_payroll_period(p_year int, p_month int)
returns setof public.payroll_entries
language plpgsql security definer set search_path = public as $$
declare
  v_period_id uuid; v_status text;
  v_period_start date := make_date(p_year, p_month, 1);
  v_period_end date := (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date;
  v_global public.payroll_global_settings%rowtype;
  v_rate_ct public.payroll_rate_settings%rowtype; v_rate_tv public.payroll_rate_settings%rowtype;
  v_rate public.payroll_rate_settings%rowtype; emp record; agg record; v_don_gia_cong numeric;
begin
  if not public.has_permission('payroll','edit') then
    raise exception 'insufficient_privilege: payroll edit permission required';
  end if;

  select * into v_global from public.payroll_global_settings where effective_from <= v_period_start order by effective_from desc limit 1;
  select * into v_rate_ct from public.payroll_rate_settings where contract_type='CT' and effective_from <= v_period_start order by effective_from desc limit 1;
  select * into v_rate_tv from public.payroll_rate_settings where contract_type='TV' and effective_from <= v_period_start order by effective_from desc limit 1;
  if v_global is null or v_rate_ct is null or v_rate_tv is null then
    raise exception 'no_effective_payroll_settings_for_period';
  end if;

  insert into public.payroll_periods (period_year, period_month) values (p_year, p_month) on conflict (period_year, period_month) do nothing;
  select id, status into v_period_id, v_status from public.payroll_periods where period_year = p_year and period_month = p_month;
  if v_status = 'locked' then raise exception 'period_is_locked: unlock before recalculating'; end if;

  for emp in
    select * from public.employees e
    where e.start_date <= v_period_end and (e.end_date is null or e.end_date >= v_period_start)
  loop
    v_rate := case when emp.contract_type = 'CT' then v_rate_ct else v_rate_tv end;
    v_don_gia_cong := v_rate.base_salary / v_global.standard_cong;

    select coalesce(sum(st.work_unit_fraction),0) as ctt,
           coalesce(sum(st.work_unit_fraction) filter (where h.holiday_date is not null),0) as cong_truc_le_tet,
           coalesce(sum(st.work_unit_fraction) filter (where st.parent_group='CA3'),0) as cong_ca_dem
    into agg
    from public.attendance_entries ae
    join public.shift_types st on st.id = ae.shift_type_id
    left join public.holidays h on h.holiday_date = ae.work_date
    where ae.employee_id = emp.id and ae.work_date between v_period_start and v_period_end;

    insert into public.payroll_entries (
      period_id, employee_id, contract_type_snapshot,
      standard_cong, ctt, cong_chinh, tang_ca, cong_truc_le_tet, cong_ca_dem,
      don_gia_cong, don_gia_tang_ca, don_gia_truc_le_tet, don_gia_nghi_le_tet, don_gia_ca_dem,
      don_gia_luong_che_do, don_gia_phep_nam, completion_bonus_amount,
      incentive_bonus_threshold_cong, incentive_bonus_rate, meal_allowance_rate, cght_knn_rate,
      global_settings_id, rate_settings_id, calculated_at, calculated_by
    ) values (
      v_period_id, emp.id, emp.contract_type,
      v_global.standard_cong, agg.ctt, least(agg.ctt, v_global.standard_cong), greatest(agg.ctt - v_global.standard_cong, 0),
      agg.cong_truc_le_tet, agg.cong_ca_dem,
      v_don_gia_cong, v_don_gia_cong * v_rate.overtime_multiplier, v_don_gia_cong * v_rate.holiday_work_multiplier,
      case when v_rate.holiday_off_pay_enabled then v_don_gia_cong else 0 end, v_don_gia_cong * v_rate.night_shift_multiplier,
      v_don_gia_cong, v_don_gia_cong, v_rate.completion_bonus_amount,
      v_global.incentive_bonus_threshold_cong, v_global.incentive_bonus_rate, v_global.meal_allowance_rate, v_global.cght_knn_rate,
      v_global.id, v_rate.id, now(), auth.uid()
    )
    on conflict (period_id, employee_id) do update set
      contract_type_snapshot = excluded.contract_type_snapshot,
      standard_cong = excluded.standard_cong, ctt = excluded.ctt, cong_chinh = excluded.cong_chinh,
      tang_ca = excluded.tang_ca, cong_truc_le_tet = excluded.cong_truc_le_tet, cong_ca_dem = excluded.cong_ca_dem,
      don_gia_cong = excluded.don_gia_cong, don_gia_tang_ca = excluded.don_gia_tang_ca,
      don_gia_truc_le_tet = excluded.don_gia_truc_le_tet, don_gia_nghi_le_tet = excluded.don_gia_nghi_le_tet,
      don_gia_ca_dem = excluded.don_gia_ca_dem, don_gia_luong_che_do = excluded.don_gia_luong_che_do,
      don_gia_phep_nam = excluded.don_gia_phep_nam, completion_bonus_amount = excluded.completion_bonus_amount,
      incentive_bonus_threshold_cong = excluded.incentive_bonus_threshold_cong,
      incentive_bonus_rate = excluded.incentive_bonus_rate, meal_allowance_rate = excluded.meal_allowance_rate,
      cght_knn_rate = excluded.cght_knn_rate, global_settings_id = excluded.global_settings_id,
      rate_settings_id = excluded.rate_settings_id, calculated_at = now(), calculated_by = auth.uid();
      -- Các trường nhập tay (cong_che_do, so_ngay_nghi_le_tet, cong_ht_dao_tao, ngay_nghi_phep_nam,
      -- cght_knn, tien_trach_nhiem, tien_hoc_viec, bo_sung_luong, tru_bhxh, thu_ho, thue_tncn, truy_thu)
      -- CỐ Ý không nằm trong SET này để giữ nguyên khi "Tính lương" chạy lại
  end loop;
  return query select * from public.payroll_entries where period_id = v_period_id;
end; $$;
revoke all on function public.calculate_payroll_period(int, int) from public;
grant execute on function public.calculate_payroll_period(int, int) to authenticated;

-- RPC chấm công: thay toàn bộ mã ca của 1 ngày, atomic. SECURITY INVOKER —
-- chạy dưới quyền người gọi nên vẫn bị chặn bởi RLS của attendance_entries
-- (has_permission('attendance','edit')).
create or replace function public.set_attendance_day(p_employee_id uuid, p_work_date date, p_shift_type_ids uuid[])
returns setof public.attendance_entries language plpgsql security invoker as $$
begin
  if not public.has_permission('attendance','edit') then raise exception 'insufficient_privilege'; end if;
  delete from public.attendance_entries where employee_id = p_employee_id and work_date = p_work_date;
  insert into public.attendance_entries (employee_id, work_date, shift_type_id, created_by, updated_by)
  select p_employee_id, p_work_date, unnest(p_shift_type_ids), auth.uid(), auth.uid();
  return query select * from public.attendance_entries where employee_id = p_employee_id and work_date = p_work_date;
end; $$;
revoke all on function public.set_attendance_day(uuid, date, uuid[]) from public;
grant execute on function public.set_attendance_day(uuid, date, uuid[]) to authenticated;
