-- ============================================================
-- 0003 — VIP customers
-- Optional attribution for cortesias: when registering an
-- invitation, the bartender may pick a previously loaded VIP
-- customer.
-- ============================================================

create table public.vip_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.vip_customers enable row level security;

create policy "vip_customers: authenticated reads"
  on public.vip_customers for select to authenticated
  using (true);

create policy "vip_customers: encargado inserts"
  on public.vip_customers for insert to authenticated
  with check (public.is_encargado());

create policy "vip_customers: encargado updates"
  on public.vip_customers for update to authenticated
  using (public.is_encargado());

create policy "vip_customers: encargado deletes"
  on public.vip_customers for delete to authenticated
  using (public.is_encargado());

alter table public.sales
  add column vip_customer_id uuid references public.vip_customers (id)
    on delete set null;
