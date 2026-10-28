-- Run once in Supabase SQL Editor after the storefront migration.
-- Storage policies inherited from the original project use public.is_admin().
-- An admin role alone must never authorize a different email address.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.users profile
    join auth.users auth_user on auth_user.id = profile.user_id
    where profile.user_id = auth.uid()
      and lower(profile.role) = 'admin'
      and lower(profile.email) = 'asmileis4evr@gmail.com'
      and lower(auth_user.email) = 'asmileis4evr@gmail.com'
      and auth_user.email_confirmed_at is not null
      and exists (
        select 1
        from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) as auth_method(value)
        where auth_method.value->>'method' = 'oauth'
      )
  );
$$;

-- Remove any old admin designation from other profiles.
update public.users
set role = 'customer'
where lower(role) = 'admin'
  and lower(email) is distinct from 'asmileis4evr@gmail.com';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_designated_admin_email_only'
  ) then
    alter table public.users
      add constraint users_designated_admin_email_only
      check (lower(role) <> 'admin' or coalesce(lower(email), '') = 'asmileis4evr@gmail.com');
  end if;
end $$;
