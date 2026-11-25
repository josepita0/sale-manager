-- ============================================================
-- Sale Manager — initial schema
-- Run this whole file in the Supabase SQL Editor (Dashboard →
-- SQL → New query → paste → Run), or via `supabase db push`.
-- ============================================================

-- 1) Tables ---------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'bartender' check (role in ('bartender', 'encargado')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_invitation boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  bartender_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed'))
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index sales_shift_id_idx on public.sales (shift_id);
create index sales_product_id_idx on public.sales (product_id);
create index shifts_bartender_idx on public.shifts (bartender_id);

-- One open shift per bartender at a time
create unique index shifts_one_open_per_bartender_idx
  on public.shifts (bartender_id)
  where status = 'open';

-- 2) Auto-create profile on user creation ---------------------

-- Roles are never taken from signup metadata: every new account
-- starts as 'bartender'. Promote the encargado manually (README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'bartender');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3) Row Level Security ---------------------------------------

alter table public.profiles enable row level security;
alter table public.products  enable row level security;
alter table public.shifts    enable row level security;
alter table public.sales     enable row level security;

-- Helper: role of the current user (security definer avoids RLS
-- recursion when policies on profiles need to read profiles).
create or replace function public.is_encargado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'encargado'
  )
$$;

-- profiles -----------------------------------------------------

create policy "profiles: read own or encargado reads all"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_encargado());

create policy "profiles: encargado manages"
  on public.profiles for update to authenticated
  using (public.is_encargado());

-- products -----------------------------------------------------

create policy "products: authenticated reads"
  on public.products for select to authenticated
  using (true);

create policy "products: encargado inserts"
  on public.products for insert to authenticated
  with check (public.is_encargado());

create policy "products: encargado updates"
  on public.products for update to authenticated
  using (public.is_encargado());

create policy "products: encargado deletes"
  on public.products for delete to authenticated
  using (public.is_encargado());

-- shifts -------------------------------------------------------

create policy "shifts: bartender reads own, encargado reads all"
  on public.shifts for select to authenticated
  using (bartender_id = auth.uid() or public.is_encargado());

create policy "shifts: bartender opens own"
  on public.shifts for insert to authenticated
  with check (bartender_id = auth.uid());

create policy "shifts: bartender closes own, encargado closes any"
  on public.shifts for update to authenticated
  using (bartender_id = auth.uid() or public.is_encargado());

-- sales --------------------------------------------------------

create policy "sales: bartender reads own, encargado reads all"
  on public.sales for select to authenticated
  using (
    public.is_encargado()
    or exists (
      select 1 from public.shifts s
      where s.id = sales.shift_id and s.bartender_id = auth.uid()
    )
  );

create policy "sales: insert only on own open shift"
  on public.sales for insert to authenticated
  with check (
    exists (
      select 1 from public.shifts s
      where s.id = sales.shift_id
        and s.bartender_id = auth.uid()
        and s.status = 'open'
    )
  );

create policy "sales: delete own sales on own open shift"
  on public.sales for delete to authenticated
  using (
    exists (
      select 1 from public.shifts s
      where s.id = sales.shift_id
        and s.bartender_id = auth.uid()
        and s.status = 'open'
    )
  );

-- 4) Example catalog (edit or remove from the app) --------------

insert into public.products (name, price, is_invitation) values
  ('Cerveza', 3500.00, false),
  ('Fernet + Coca', 5000.00, false),
  ('Gin Tonic', 5500.00, false),
  ('Vodka + Sprite', 5000.00, false),
  ('Coca', 2500.00, false),
  ('Agua', 2000.00, false),
  ('Cortesía Trago', 5000.00, true),
  ('Cortesía Cerveza', 3500.00, true);
