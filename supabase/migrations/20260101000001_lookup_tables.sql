-- Danh mục dùng chung: đối tác, chức vụ, ca trực, ngày lễ/tết.

create table public.partners (
  code text primary key,
  name text not null,
  is_active boolean not null default true
);

create table public.positions (
  code text primary key,
  name text not null,
  is_active boolean not null default true
);

create table public.shift_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                       -- 'HC','H1','S1','C1H2','3', ... (không lưu biến thể "L")
  label text not null,
  time_range text,
  parent_group text not null check (parent_group in ('HC','CA1','CA2','CA3')),
  work_unit_fraction numeric(6,4) not null check (work_unit_fraction > 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Biến thể "L" (làm ngày Lễ/Tết) không nhân bản trong shift_types — ngày làm lễ
-- được xác định bằng cách join work_date với bảng holidays khi tổng hợp lương.
