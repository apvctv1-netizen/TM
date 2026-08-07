-- Kỳ lương và bảng lương chi tiết từng nhân viên/kỳ.

create table public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  status text not null check (status in ('open','locked')) default 'open',
  locked_at timestamptz,
  locked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (period_year, period_month)
);

create table public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  contract_type_snapshot text not null check (contract_type_snapshot in ('CT','TV')),
  -- công: tự động từ chấm công (ghi đè mỗi lần "Tính lương")
  standard_cong numeric(5,2) not null default 0,
  ctt numeric(6,2) not null default 0,
  cong_chinh numeric(6,2) not null default 0,
  tang_ca numeric(6,2) not null default 0,
  cong_truc_le_tet numeric(6,2) not null default 0,
  cong_ca_dem numeric(6,2) not null default 0,
  -- công: nhập tay (giữ nguyên qua các lần tính lại)
  cong_che_do numeric(6,2) not null default 0,
  so_ngay_nghi_le_tet numeric(6,2) not null default 0,
  cong_ht_dao_tao numeric(6,2) not null default 0,
  ngay_nghi_phep_nam numeric(6,2) not null default 0,
  cght_knn numeric(6,2) not null default 0,
  -- đơn giá snapshot (audit trail)
  don_gia_cong numeric(14,2) not null default 0,
  don_gia_tang_ca numeric(14,2) not null default 0,
  don_gia_truc_le_tet numeric(14,2) not null default 0,
  don_gia_nghi_le_tet numeric(14,2) not null default 0,
  don_gia_ca_dem numeric(14,2) not null default 0,
  don_gia_luong_che_do numeric(14,2) not null default 0,
  don_gia_phep_nam numeric(14,2) not null default 0,
  completion_bonus_amount numeric(14,2) not null default 0,
  incentive_bonus_threshold_cong numeric(5,2) not null default 0,
  incentive_bonus_rate numeric(14,2) not null default 0,
  meal_allowance_rate numeric(14,2) not null default 0,
  cght_knn_rate numeric(14,2) not null default 0,
  -- tiền: nhập tay
  tien_trach_nhiem numeric(14,2) not null default 0,
  tien_hoc_viec numeric(14,2) not null default 0,
  bo_sung_luong numeric(14,2) not null default 0,
  tru_bhxh numeric(14,2) not null default 0,
  thu_ho numeric(14,2) not null default 0,
  thue_tncn numeric(14,2) not null default 0,
  truy_thu numeric(14,2) not null default 0,
  -- tiền: tự tính (trigger)
  luong_theo_ctt numeric(14,2) not null default 0,
  tien_tang_ca numeric(14,2) not null default 0,
  tien_truc_le_tet numeric(14,2) not null default 0,
  tien_nghi_le_tet numeric(14,2) not null default 0,
  tien_ca_dem numeric(14,2) not null default 0,
  tien_luong_che_do numeric(14,2) not null default 0,
  tien_phep_nam numeric(14,2) not null default 0,
  thuong_hoan_thanh numeric(14,2) not null default 0,
  thuong_khuyen_khich numeric(14,2) not null default 0,
  ho_tro_an_giua_ca numeric(14,2) not null default 0,
  tien_thuong_cght_knn numeric(14,2) not null default 0,
  tong_luong numeric(14,2) not null default 0,
  tong_khau_tru numeric(14,2) not null default 0,
  tong_luong_nhan numeric(14,2) not null default 0,
  global_settings_id uuid references public.payroll_global_settings(id),
  rate_settings_id uuid references public.payroll_rate_settings(id),
  calculated_at timestamptz,
  calculated_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  unique (period_id, employee_id)
);
create index payroll_entries_employee_idx on public.payroll_entries(employee_id);
