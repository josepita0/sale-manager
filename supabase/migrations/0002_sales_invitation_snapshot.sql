-- ============================================================
-- 0002 — Snapshot the cortesia classification on each sale
-- Fixes review finding R3-001: reports must never retroactively
-- reclassify sales when a product's is_invitation flag changes.
-- ============================================================

alter table public.sales
  add column is_invitation boolean not null default false;

-- Backfill existing rows from the product flag.
update public.sales s
set is_invitation = p.is_invitation
from public.products p
where s.product_id = p.id;
