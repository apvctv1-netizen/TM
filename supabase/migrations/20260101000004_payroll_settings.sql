-- Cấu hình lương, hiệu lực theo ngày (effective_from), tách riêng theo loại
-- hợp đồng cho đơn giá/hệ số. Bảng lương cũ (payroll_entries) lưu snapshot nên
-- không bao giờ đổi số dù sau này chỉnh các bảng cấu hình này.

create table public.payroll_global_settings (
  id uuid primary key default gen_random_uuid(),
  effective_from date not null unique,
  standard_cong numeric(5,2) not null default 26,
  incentive_bonus_threshold_cong numeric(5,2) not null default 25,
  incentive_bonus_rate numeric(12,2) not null default 16000,
  meal_allowance_rate numeric(12,2) not null default 30000,
  cght_knn_rate numeric(12,2) not null default 50000,
  social_insurance_rate numeric(5,4) not null default 0.105,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table public.payroll_rate_settings (
  id uuid primary key default gen_random_uuid(),
  effective_from date not null,
  contract_type text not null check (contract_type in ('CT','TV')),
  base_salary numeric(14,2) not null,
  overtime_multiplier numeric(5,4) not null default 1.5,
  holiday_work_multiplier numeric(5,4) not null default 3.0,
  night_shift_multiplier numeric(5,4) not null default 0.3,
  holiday_off_pay_enabled boolean not null default true,     -- false ⇒ TV không có tiền nghỉ lễ/tết
  completion_bonus_amount numeric(12,2) not null default 200000,
  created_at timestamptz not null default now(),
  created_by uuid,
  unique (effective_from, contract_type)
);
create index payroll_rate_settings_lookup_idx on public.payroll_rate_settings(contract_type, effective_from desc);
