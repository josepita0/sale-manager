-- ============================================================
-- 0006 — Roles as a native enum
-- ADMIN (owner, permisología to be defined), MANAGER (the old
-- 'encargado': full management) and BARTENDER (register sales).
-- Until the ADMIN permisología is defined, admin keeps the same
-- authorizations as manager (is_encargado covers both).
-- ============================================================

create type public.user_role as enum ('admin', 'manager', 'bartender');

alter table public.profiles drop constraint profiles_role_check;

alter table public.profiles
  alter column role type public.user_role
  using case role
    when 'encargado' then 'manager'::public.user_role
    else 'bartender'::public.user_role
  end,
  alter column role set default 'bartender';

-- Staff check used by every policy: manager or admin (ADMIN's own
-- permisología will tighten this later).
create or replace function public.is_encargado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin')
  )
$$;

-- Ready for the future ADMIN permisología.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;
