-- ============================================================
-- 0005 — Open accounts (cuentas)
-- A bartender may open named accounts (free name or VIP customer)
-- inside a shift and keep registering products into them in
-- parallel. Registering the account charges its items; the account
-- is closed (status = 'closed').
-- ============================================================

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  name text not null,
  vip_customer_id uuid references public.vip_customers (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index accounts_shift_id_idx on public.accounts (shift_id);

alter table public.accounts enable row level security;

create policy "accounts: shift bartender or encargado reads"
  on public.accounts for select to authenticated
  using (
    public.is_encargado()
    or exists (
      select 1 from public.shifts s
      where s.id = accounts.shift_id and s.bartender_id = auth.uid()
    )
  );

create policy "accounts: open on own open shift"
  on public.accounts for insert to authenticated
  with check (
    exists (
      select 1 from public.shifts s
      where s.id = accounts.shift_id
        and s.bartender_id = auth.uid()
        and s.status = 'open'
    )
  );

create policy "accounts: close or edit own open-shift account"
  on public.accounts for update to authenticated
  using (
    public.is_encargado()
    or exists (
      select 1 from public.shifts s
      where s.id = accounts.shift_id
        and s.bartender_id = auth.uid()
        and s.status = 'open'
    )
  );

create policy "accounts: delete own open-shift account"
  on public.accounts for delete to authenticated
  using (
    exists (
      select 1 from public.shifts s
      where s.id = accounts.shift_id
        and s.bartender_id = auth.uid()
        and s.status = 'open'
    )
  );

alter table public.sales
  add column account_id uuid references public.accounts (id)
    on delete set null;
