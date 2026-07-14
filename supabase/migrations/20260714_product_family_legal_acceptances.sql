-- One shared acceptance record for Psychosocial, Nursing, and Complete Suite users.
-- This table stores account/legal evidence only and never participant information.

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  terms_version text not null,
  privacy_version text not null,
  acceptance_context text not null,
  source_app text not null,
  authority_to_bind_facility boolean not null default false,
  accepted_at timestamptz not null default now(),
  constraint legal_acceptances_context_check
    check (acceptance_context in ('facility_signup', 'existing_user', 'staff_invitation')),
  constraint legal_acceptances_source_check
    check (source_app in ('psychosocial', 'nursing')),
  constraint legal_acceptances_version_unique
    unique (user_id, terms_version, privacy_version)
);

create index if not exists legal_acceptances_organization_idx
  on public.legal_acceptances (organization_id, accepted_at desc);

comment on table public.legal_acceptances is
  'Versioned Terms and Privacy acceptance evidence for staff accounts; contains no participant or intake-form information.';

alter table public.legal_acceptances enable row level security;

drop policy if exists "Users can read their own legal acceptances"
  on public.legal_acceptances;
create policy "Users can read their own legal acceptances"
on public.legal_acceptances
for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.legal_acceptances from public, anon;
revoke insert, update, delete on table public.legal_acceptances from authenticated;
grant select on table public.legal_acceptances to authenticated;
grant all on table public.legal_acceptances to service_role;
