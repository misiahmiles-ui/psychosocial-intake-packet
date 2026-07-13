begin;

-- Shared facility/account data only. Never add intake-form or health-record content here.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null check (length(trim(facility_name)) > 0),
  facility_location_key text not null unique check (length(trim(facility_location_key)) > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  stripe_customer_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, user_id),
  constraint organization_memberships_role_check
    check (role in ('facility_admin', 'staff')),
  constraint organization_memberships_status_check
    check (status in ('active', 'invited', 'suspended'))
);

create table if not exists public.organization_subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_code text not null,
  status text not null default 'incomplete',
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  current_period_end timestamptz,
  upfront_paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_subscriptions_plan_check
    check (plan_code in ('psychosocial', 'nursing', 'complete_suite')),
  constraint organization_subscriptions_status_check
    check (
      status in (
        'incomplete',
        'trialing',
        'active',
        'past_due',
        'unpaid',
        'canceled'
      )
    )
);

create table if not exists public.organization_product_entitlements (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_code text not null,
  status text not null default 'active',
  included_seats integer not null default 0 check (included_seats >= 0),
  additional_seats integer not null default 0 check (additional_seats >= 0),
  seat_limit integer generated always as (included_seats + additional_seats) stored,
  stripe_additional_seat_price_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, product_code),
  constraint organization_product_entitlements_product_check
    check (product_code in ('psychosocial', 'nursing')),
  constraint organization_product_entitlements_status_check
    check (status in ('active', 'disabled'))
);

create table if not exists public.workflow_seat_assignments (
  organization_id uuid not null,
  user_id uuid not null,
  product_code text not null,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, user_id, product_code),
  constraint workflow_seat_assignments_membership_fk
    foreign key (organization_id, user_id)
    references public.organization_memberships(organization_id, user_id)
    on delete cascade,
  constraint workflow_seat_assignments_entitlement_fk
    foreign key (organization_id, product_code)
    references public.organization_product_entitlements(organization_id, product_code)
    on delete restrict,
  constraint workflow_seat_assignments_product_check
    check (product_code in ('psychosocial', 'nursing'))
);

comment on table public.organizations is
  'One record per licensed physical facility; facility/account/billing data only.';
comment on table public.organization_memberships is
  'Individual staff accounts belonging to a facility. Password sharing is not supported.';
comment on table public.organization_subscriptions is
  'Facility plan and Stripe billing references only.';
comment on table public.organization_product_entitlements is
  'Separate paid Psychosocial and Nursing workflow seat limits.';
comment on table public.workflow_seat_assignments is
  'Named workflow assignments. A user may hold one assignment for each product.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function public.set_updated_at();

create trigger organization_subscriptions_set_updated_at
before update on public.organization_subscriptions
for each row execute function public.set_updated_at();

create trigger organization_product_entitlements_set_updated_at
before update on public.organization_product_entitlements
for each row execute function public.set_updated_at();

create or replace function public.enforce_workflow_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_limit integer;
  seats_in_use integer;
begin
  if not exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = new.organization_id
      and membership.user_id = new.user_id
      and membership.status = 'active'
  ) then
    raise exception 'An active facility membership is required before assigning a workflow seat.';
  end if;

  if exists (
    select 1
    from public.profiles profile
    where profile.id = new.user_id
      and profile.account_role = 'owner'
  ) then
    raise exception 'Product-owner access is separate and cannot consume a customer seat.';
  end if;

  select entitlement.seat_limit
    into paid_limit
  from public.organization_product_entitlements entitlement
  where entitlement.organization_id = new.organization_id
    and entitlement.product_code = new.product_code
    and entitlement.status = 'active'
  for update;

  if paid_limit is null then
    raise exception 'An active product entitlement is required before assigning a workflow seat.';
  end if;

  select count(*)
    into seats_in_use
  from public.workflow_seat_assignments assignment
  where assignment.organization_id = new.organization_id
    and assignment.product_code = new.product_code;

  if seats_in_use >= paid_limit then
    raise exception 'The paid % workflow seat limit has been reached.', new.product_code;
  end if;

  return new;
end;
$$;

create trigger workflow_seat_assignments_enforce_limit
before insert on public.workflow_seat_assignments
for each row execute function public.enforce_workflow_seat_limit();

create or replace function public.prevent_entitlement_below_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seats_in_use integer;
  proposed_limit integer;
begin
  select count(*)
    into seats_in_use
  from public.workflow_seat_assignments assignment
  where assignment.organization_id = new.organization_id
    and assignment.product_code = new.product_code;

  proposed_limit := new.included_seats + new.additional_seats;

  if new.status <> 'active' and seats_in_use > 0 then
    raise exception 'Remove assigned seats before disabling this product entitlement.';
  end if;

  if proposed_limit < seats_in_use then
    raise exception 'The paid seat limit cannot be lower than assigned seats.';
  end if;

  return new;
end;
$$;

create trigger organization_product_entitlements_protect_usage
before update of status, included_seats, additional_seats
on public.organization_product_entitlements
for each row execute function public.prevent_entitlement_below_usage();

create or replace function public.is_product_owner(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = check_user_id
      and profile.account_role = 'owner'
  );
$$;

create or replace function public.is_active_organization_member(
  check_organization_id uuid,
  check_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = check_organization_id
      and membership.user_id = check_user_id
      and membership.status = 'active'
  );
$$;

create or replace function public.is_facility_admin(
  check_organization_id uuid,
  check_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = check_organization_id
      and membership.user_id = check_user_id
      and membership.role = 'facility_admin'
      and membership.status = 'active'
  );
$$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.organization_product_entitlements enable row level security;
alter table public.workflow_seat_assignments enable row level security;

create policy "Organization members can read their facility"
on public.organizations
for select
using (
  public.is_active_organization_member(id, auth.uid())
  or public.is_product_owner(auth.uid())
);

create policy "Staff can read permitted memberships"
on public.organization_memberships
for select
using (
  user_id = auth.uid()
  or public.is_facility_admin(organization_id, auth.uid())
  or public.is_product_owner(auth.uid())
);

create policy "Organization members can read subscription status"
on public.organization_subscriptions
for select
using (
  public.is_active_organization_member(organization_id, auth.uid())
  or public.is_product_owner(auth.uid())
);

create policy "Organization members can read product entitlements"
on public.organization_product_entitlements
for select
using (
  public.is_active_organization_member(organization_id, auth.uid())
  or public.is_product_owner(auth.uid())
);

create policy "Staff can read permitted seat assignments"
on public.workflow_seat_assignments
for select
using (
  user_id = auth.uid()
  or public.is_facility_admin(organization_id, auth.uid())
  or public.is_product_owner(auth.uid())
);

-- Writes intentionally have no browser-facing RLS policies. A future reviewed server
-- endpoint may use the service role after verifying facility-admin or billing authority.
commit;
