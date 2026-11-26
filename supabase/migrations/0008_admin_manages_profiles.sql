-- ============================================================
-- 0008 — User management is admin-only
-- Editing user data (name, role) joins user creation as an admin
-- capability. The old "encargado manages" update policy predates
-- the role split, so it is replaced: only is_admin() may update
-- profiles now. The select policy stays untouched — the shift
-- history embeds bartender names and managers read it. Password
-- resets go through the `update-user` Edge Function (service-side).
-- ============================================================

drop policy "profiles: encargado manages" on public.profiles;

create policy "profiles: admin manages"
  on public.profiles for update
  to authenticated
  using (public.is_admin());
