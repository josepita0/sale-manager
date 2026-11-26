-- ============================================================
-- 0007 — Roles are never granted from signup metadata
-- The admin creates users through the `create-user` Edge Function,
-- which assigns the requested role server-side with the service
-- client after signup. Public signup would otherwise let anyone
-- claim a role by sending user_metadata, so the signup trigger
-- keeps the original policy: every new account is a bartender and
-- only full_name is read from metadata. Roles change later from
-- the dashboard or the admin Users tab (service-side only).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'bartender'::public.user_role
  );
  return new;
end;
$$;
