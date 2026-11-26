-- ============================================================
-- 0007 — Signup trigger honors the requested role
-- Admins create users from the app through the `create-user`
-- Edge Function, which calls the Auth Admin API with
-- email_confirm: true (no email is ever sent). The requested
-- role travels in user_metadata; unknown or missing values fall
-- back to 'bartender' so a bad payload can't break signup.
-- (Admin already reads all profiles through the existing
-- "profiles: read own or encargado reads all" policy.)
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
    case new.raw_user_meta_data ->> 'role'
      when 'admin' then 'admin'::public.user_role
      when 'manager' then 'manager'::public.user_role
      else 'bartender'::public.user_role
    end
  );
  return new;
end;
$$;
