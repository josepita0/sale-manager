-- ============================================================
-- 0004 — Cortesia is decided per sale, not per product
-- The bartender picks Venta/Cortesia at sale time; the snapshot
-- lives in sales.is_invitation. The product-level flag and the
-- placeholder gift products are removed.
-- ============================================================

delete from public.products where is_invitation;

alter table public.products drop column is_invitation;
