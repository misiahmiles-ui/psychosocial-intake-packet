begin;

-- Purchase/account entitlement metadata only. These tables must never contain
-- intake facts, assessment text, participant identifiers, or clinical content.
create table if not exists public.psychosocial_assessment_generation_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  purchase_reference text not null unique check (length(trim(purchase_reference)) > 0),
  included_quantity integer not null check (included_quantity > 0),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint psychosocial_assessment_generation_entitlements_owner_check
    check (num_nonnulls(organization_id, user_id) = 1),
  constraint psychosocial_assessment_generation_entitlements_window_check
    check (expires_at > starts_at)
);

create index if not exists psychosocial_assessment_entitlements_organization_idx
  on public.psychosocial_assessment_generation_entitlements (organization_id, starts_at)
  where organization_id is not null;

create index if not exists psychosocial_assessment_entitlements_user_idx
  on public.psychosocial_assessment_generation_entitlements (user_id, starts_at)
  where user_id is not null;

create table if not exists public.psychosocial_assessment_generation_events (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null
    references public.psychosocial_assessment_generation_entitlements(id)
    on delete cascade,
  initiated_by_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('reserved', 'completed', 'released')),
  reserved_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status in ('reserved', 'released') and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create index if not exists psychosocial_assessment_generation_events_entitlement_idx
  on public.psychosocial_assessment_generation_events (entitlement_id, status);

create index if not exists psychosocial_assessment_generation_events_user_attempt_idx
  on public.psychosocial_assessment_generation_events
  (initiated_by_user_id, reserved_at);

create index if not exists psychosocial_assessment_generation_events_reserved_idx
  on public.psychosocial_assessment_generation_events (reserved_at)
  where status = 'reserved';

alter table public.psychosocial_assessment_generation_entitlements
  enable row level security;
alter table public.psychosocial_assessment_generation_events
  enable row level security;

revoke all on table public.psychosocial_assessment_generation_entitlements
  from anon, authenticated;
revoke all on table public.psychosocial_assessment_generation_events
  from anon, authenticated;

create or replace function public.psychosocial_grant_assessment_generation_entitlement(
  p_organization_id uuid,
  p_user_id uuid,
  p_purchase_reference text,
  p_starts_at timestamptz,
  p_included_quantity integer,
  p_entitlement_window_days integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement_id uuid;
  v_expires_at timestamptz;
begin
  if num_nonnulls(p_organization_id, p_user_id) <> 1
    or length(trim(coalesce(p_purchase_reference, ''))) = 0
    or p_starts_at is null
    or p_included_quantity < 1
    or p_included_quantity > 1000
    or p_entitlement_window_days < 1
    or p_entitlement_window_days > 365 then
    raise exception 'Invalid assessment generation entitlement parameters.';
  end if;

  v_expires_at := p_starts_at
    + make_interval(hours => p_entitlement_window_days * 24);

  insert into public.psychosocial_assessment_generation_entitlements (
    organization_id,
    user_id,
    purchase_reference,
    included_quantity,
    starts_at,
    expires_at
  ) values (
    p_organization_id,
    p_user_id,
    trim(p_purchase_reference),
    p_included_quantity,
    p_starts_at,
    v_expires_at
  )
  on conflict (purchase_reference) do nothing
  returning id into v_entitlement_id;

  if v_entitlement_id is null then
    select entitlement.id into v_entitlement_id
    from public.psychosocial_assessment_generation_entitlements entitlement
    where entitlement.purchase_reference = trim(p_purchase_reference)
      and entitlement.organization_id is not distinct from p_organization_id
      and entitlement.user_id is not distinct from p_user_id
      and entitlement.included_quantity = p_included_quantity
      and entitlement.starts_at = p_starts_at
      and entitlement.expires_at = v_expires_at;
  end if;

  if v_entitlement_id is null then
    raise exception 'The purchase reference is already bound to another entitlement.';
  end if;

  return v_entitlement_id;
end;
$$;

create or replace function public.psychosocial_reserve_assessment_generation(
  p_user_id uuid,
  p_entitlement_id uuid,
  p_rapid_limit integer,
  p_rapid_window_seconds integer,
  p_reservation_ttl_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_included_quantity integer;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_completed integer;
  v_active_reserved integer;
  v_recent_attempts integer;
  v_reservation_id uuid;
begin
  if p_rapid_limit < 1
    or p_rapid_window_seconds < 1
    or p_reservation_ttl_seconds < 1 then
    raise exception 'Invalid assessment generation reservation parameters.';
  end if;

  select
    entitlement.included_quantity,
    entitlement.starts_at,
    entitlement.expires_at
  into
    v_included_quantity,
    v_starts_at,
    v_expires_at
  from public.psychosocial_assessment_generation_entitlements entitlement
  where entitlement.id = p_entitlement_id
    and (
      entitlement.user_id = p_user_id
      or (
        entitlement.organization_id is not null
        and exists (
          select 1
          from public.organization_memberships membership
          join public.workflow_seat_assignments assignment
            on assignment.organization_id = membership.organization_id
           and assignment.user_id = membership.user_id
           and assignment.product_code = 'psychosocial'
          join public.organization_product_entitlements product_entitlement
            on product_entitlement.organization_id = assignment.organization_id
           and product_entitlement.product_code = assignment.product_code
           and product_entitlement.status = 'active'
          where membership.organization_id = entitlement.organization_id
            and membership.user_id = p_user_id
            and membership.status = 'active'
        )
      )
    );

  if v_included_quantity is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'entitlement_unavailable',
      'reservationId', null,
      'includedQuantity', 0,
      'successfulGenerationsUsed', 0,
      'remainingGenerations', 0,
      'entitlementStartsAt', null,
      'entitlementExpiresAt', null
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_entitlement_id::text, 0));

  delete from public.psychosocial_assessment_generation_events
  where status = 'released'
    and reserved_at < now() - interval '7 days';

  update public.psychosocial_assessment_generation_events
  set status = 'released'
  where entitlement_id = p_entitlement_id
    and status = 'reserved'
    and reserved_at < now() - make_interval(secs => p_reservation_ttl_seconds);

  select count(*) into v_completed
  from public.psychosocial_assessment_generation_events
  where entitlement_id = p_entitlement_id
    and status = 'completed';

  if now() < v_starts_at or now() >= v_expires_at then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'entitlement_inactive',
      'reservationId', null,
      'includedQuantity', v_included_quantity,
      'successfulGenerationsUsed', v_completed,
      'remainingGenerations', greatest(v_included_quantity - v_completed, 0),
      'entitlementStartsAt', v_starts_at,
      'entitlementExpiresAt', v_expires_at
    );
  end if;

  select count(*) into v_active_reserved
  from public.psychosocial_assessment_generation_events
  where entitlement_id = p_entitlement_id
    and status = 'reserved';

  if v_completed + v_active_reserved >= v_included_quantity then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'entitlement_exhausted',
      'reservationId', null,
      'includedQuantity', v_included_quantity,
      'successfulGenerationsUsed', v_completed,
      'remainingGenerations', greatest(v_included_quantity - v_completed, 0),
      'entitlementStartsAt', v_starts_at,
      'entitlementExpiresAt', v_expires_at
    );
  end if;

  select count(*) into v_recent_attempts
  from public.psychosocial_assessment_generation_events
  where initiated_by_user_id = p_user_id
    and reserved_at >= now() - make_interval(secs => p_rapid_window_seconds);

  if v_recent_attempts >= p_rapid_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'rapid_limit',
      'reservationId', null,
      'includedQuantity', v_included_quantity,
      'successfulGenerationsUsed', v_completed,
      'remainingGenerations', greatest(v_included_quantity - v_completed, 0),
      'entitlementStartsAt', v_starts_at,
      'entitlementExpiresAt', v_expires_at
    );
  end if;

  insert into public.psychosocial_assessment_generation_events (
    entitlement_id,
    initiated_by_user_id,
    status
  ) values (
    p_entitlement_id,
    p_user_id,
    'reserved'
  ) returning id into v_reservation_id;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'allowed',
    'reservationId', v_reservation_id,
    'includedQuantity', v_included_quantity,
    'successfulGenerationsUsed', v_completed,
    'remainingGenerations', greatest(v_included_quantity - v_completed, 0),
    'entitlementStartsAt', v_starts_at,
    'entitlementExpiresAt', v_expires_at
  );
end;
$$;

create or replace function public.psychosocial_complete_assessment_generation(
  p_user_id uuid,
  p_reservation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement_id uuid;
  v_included_quantity integer;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_completed integer;
begin
  update public.psychosocial_assessment_generation_events
  set status = 'completed', completed_at = now()
  where id = p_reservation_id
    and initiated_by_user_id = p_user_id
    and status = 'reserved'
  returning entitlement_id into v_entitlement_id;

  if v_entitlement_id is null then
    raise exception 'Assessment generation reservation was not found.';
  end if;

  select included_quantity, starts_at, expires_at
  into v_included_quantity, v_starts_at, v_expires_at
  from public.psychosocial_assessment_generation_entitlements
  where id = v_entitlement_id;

  select count(*) into v_completed
  from public.psychosocial_assessment_generation_events
  where entitlement_id = v_entitlement_id
    and status = 'completed';

  return jsonb_build_object(
    'includedQuantity', v_included_quantity,
    'successfulGenerationsUsed', v_completed,
    'remainingGenerations', greatest(v_included_quantity - v_completed, 0),
    'entitlementStartsAt', v_starts_at,
    'entitlementExpiresAt', v_expires_at
  );
end;
$$;

create or replace function public.psychosocial_release_assessment_generation(
  p_user_id uuid,
  p_reservation_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.psychosocial_assessment_generation_events
  set status = 'released'
  where id = p_reservation_id
    and initiated_by_user_id = p_user_id
    and status = 'reserved';
$$;

revoke all on function public.psychosocial_grant_assessment_generation_entitlement(
  uuid, uuid, text, timestamptz, integer, integer
) from public;
revoke all on function public.psychosocial_reserve_assessment_generation(
  uuid, uuid, integer, integer, integer
) from public;
revoke all on function public.psychosocial_complete_assessment_generation(
  uuid, uuid
) from public;
revoke all on function public.psychosocial_release_assessment_generation(
  uuid, uuid
) from public;

grant execute on function public.psychosocial_grant_assessment_generation_entitlement(
  uuid, uuid, text, timestamptz, integer, integer
) to service_role;
grant execute on function public.psychosocial_reserve_assessment_generation(
  uuid, uuid, integer, integer, integer
) to service_role;
grant execute on function public.psychosocial_complete_assessment_generation(
  uuid, uuid
) to service_role;
grant execute on function public.psychosocial_release_assessment_generation(
  uuid, uuid
) to service_role;

comment on table public.psychosocial_assessment_generation_entitlements is
  'Purchase-scoped assessment-generation quantities and 30-day activation windows only; never PHI.';
comment on table public.psychosocial_assessment_generation_events is
  'Assessment-generation reservation/completion metadata only; never PHI or clinical content.';

commit;
