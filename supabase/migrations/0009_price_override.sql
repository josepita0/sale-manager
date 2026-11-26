-- 0009: price override per sale (discount only, never free — free is cortesía).
-- unit_price keeps the catalog price snapshot at insert time for auditing;
-- price_override is the agreed price for this specific sale when it differs
-- from the catalog. Effective price = COALESCE(price_override, unit_price).
-- "Solo bajar": the override must stay under the catalog snapshot, and it can
-- never be zero or negative (giving products away is the cortesía flow).
alter table public.sales
  add column price_override numeric,
  add constraint sales_price_override_positive check (price_override > 0),
  add constraint sales_price_override_below_catalog check (price_override < unit_price);
