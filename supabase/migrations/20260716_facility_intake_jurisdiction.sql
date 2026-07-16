alter table public.organizations
  add column if not exists intake_jurisdiction text not null default 'NJ';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_intake_jurisdiction_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_intake_jurisdiction_check
      check (intake_jurisdiction in ('NJ', 'MD'));
  end if;
end
$$;

comment on column public.organizations.intake_jurisdiction is
  'Facility-level state edition for the shared intake workflows; never participant information.';
