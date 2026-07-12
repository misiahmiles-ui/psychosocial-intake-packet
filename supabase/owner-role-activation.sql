-- Private owner-role activation template.
-- Run this manually in the Supabase SQL Editor after replacing
-- <OWNER_EMAIL_HERE> with the creator/owner account email.
--
-- This does not store client/member/participant intake responses.
-- It only marks one authenticated account as the product owner.

alter table public.profiles
add column if not exists account_role text not null default 'buyer';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_account_role_check
    check (account_role in ('buyer', 'owner'));
  end if;
end $$;

update public.profiles
set
  account_role = 'owner',
  has_access = false,
  updated_at = now()
where lower(email) = lower('<OWNER_EMAIL_HERE>');

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'account_role', 'owner',
    'owner_access', true
  )
where lower(email) = lower('<OWNER_EMAIL_HERE>');
