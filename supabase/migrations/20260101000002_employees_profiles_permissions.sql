-- Nhân sự, tài khoản đăng nhập, và phân quyền theo chức năng.

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code integer not null unique,           -- "ID" 8301
  full_name text not null,
  start_date date not null,
  end_date date,                                    -- ngày kết thúc công việc
  gender text check (gender in ('Nam','Nữ','Khác')),
  dob date,
  id_number text,
  id_issue_date date,
  id_issue_place text,
  permanent_address text,
  phone text,
  email text,
  education_level text,
  partner_code text references public.partners(code),
  position_code text references public.positions(code),
  contract_type text not null check (contract_type in ('CT','TV')) default 'TV',
  note text,                                        -- ghi chú
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index employees_partner_code_idx on public.employees(partner_code);
create index employees_position_code_idx on public.employees(position_code);
create index employees_end_date_idx on public.employees(end_date);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin','hr','employee')) default 'employee',
  employee_id uuid references public.employees(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_employee_id_uq on public.profiles(employee_id) where employee_id is not null;

create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null check (feature in ('personnel','attendance','payroll','payroll_settings','reports','user_management')),
  can_view boolean not null default true,
  can_edit boolean not null default false,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  unique (user_id, feature)
);

-- Tự tạo hồ sơ `profiles` khi có user mới đăng ký qua Supabase Auth.
-- role/full_name ban đầu lấy từ raw_app_meta_data (đặt server-side khi admin
-- mời tài khoản qua supabaseAdmin.auth.admin.inviteUserByEmail — user không
-- tự sửa được trường này).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_app_meta_data->>'full_name', new.email),
          coalesce(new.raw_app_meta_data->>'role','employee'));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
