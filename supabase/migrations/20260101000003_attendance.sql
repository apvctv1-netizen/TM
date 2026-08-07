-- Chấm công theo ngày. Một ngày công của 1 nhân viên có thể gồm nhiều mã ca
-- (vd "C1, S2"), nên khoá duy nhất trên (employee_id, work_date, shift_type_id)
-- chứ không phải (employee_id, work_date).

create table public.attendance_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null,
  shift_type_id uuid not null references public.shift_types(id),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  unique (employee_id, work_date, shift_type_id)
);
create index attendance_entries_employee_date_idx on public.attendance_entries(employee_id, work_date);
create index attendance_entries_date_idx on public.attendance_entries(work_date);
