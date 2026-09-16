-- Account-level quota ledger only. This table must never contain intake facts,
-- assessment text, participant identifiers, or other clinical content.
create table if not exists public.psychosocial_assessment_generation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quota_month text not null check (quota_month ~ '^\d{4}-\d{2}$'),
  status text not null check (status in ('reserved', 'completed', 'released')),
  reserved_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status in ('reserved', 'released') and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create index if not exists psychosocial_assessment_generation_events_user_month_idx
  on public.psychosocial_assessment_generation_events (user_id, quota_month, status);

create index if not exists psychosocial_assessment_generation_events_reserved_idx
  on public.psychosocial_assessment_generation_events (reserved_at)
  where status = 'reserved';

alter table public.psychosocial_assessment_generation_events enable row level security;

revoke all on table public.psychosocial_assessment_generation_events from anon, authenticated;

create or replace function public.psychosocial_reserve_assessment_generation(
  p_user_id uuid,
  p_month text,
  p_monthly_limit integer,
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
  v_completed integer;
  v_active_reserved integer;
  v_recent_attempts integer;
  v_reservation_id uuid;
begin
  if p_month !~ '^\d{4}-\d{2}$'
    or p_monthly_limit < 1
    or p_rapid_limit < 1
    or p_rapid_window_seconds < 1
    or p_reservation_ttl_seconds < 1 then
    raise exception 'Invalid assessment quota parameters.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_month, 0));

  delete from public.psychosocial_assessment_generation_events
  where status = 'released'
    and reserved_at < now() - interval '7 days';

  update public.psychosocial_assessment_generation_events
  set status = 'released'
  where user_id = p_user_id
    and status = 'reserved'
    and reserved_at < now() - make_interval(secs => p_reservation_ttl_seconds);

  select count(*) into v_completed
  from public.psychosocial_assessment_generation_events
  where user_id = p_user_id
    and quota_month = p_month
    and status = 'completed';

  select count(*) into v_active_reserved
  from public.psychosocial_assessment_generation_events
  where user_id = p_user_id
    and quota_month = p_month
    and status = 'reserved';

  if v_completed + v_active_reserved >= p_monthly_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_quota',
      'reservationId', null,
      'monthlyLimit', p_monthly_limit,
      'successfulGenerationsThisMonth', v_completed,
      'remainingSuccessfulGenerations', greatest(p_monthly_limit - v_completed, 0)
    );
  end if;

  select count(*) into v_recent_attempts
  from public.psychosocial_assessment_generation_events
  where user_id = p_user_id
    and reserved_at >= now() - make_interval(secs => p_rapid_window_seconds);

  if v_recent_attempts >= p_rapid_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'rapid_limit',
      'reservationId', null,
      'monthlyLimit', p_monthly_limit,
      'successfulGenerationsThisMonth', v_completed,
      'remainingSuccessfulGenerations', greatest(p_monthly_limit - v_completed, 0)
    );
  end if;

  insert into public.psychosocial_assessment_generation_events (
    user_id,
    quota_month,
    status
  ) values (
    p_user_id,
    p_month,
    'reserved'
  ) returning id into v_reservation_id;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'allowed',
    'reservationId', v_reservation_id,
    'monthlyLimit', p_monthly_limit,
    'successfulGenerationsThisMonth', v_completed,
    'remainingSuccessfulGenerations', greatest(p_monthly_limit - v_completed, 0)
  );
end;
$$;

create or replace function public.psychosocial_complete_assessment_generation(
  p_user_id uuid,
  p_reservation_id uuid,
  p_monthly_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month text;
  v_completed integer;
begin
  update public.psychosocial_assessment_generation_events
  set status = 'completed', completed_at = now()
  where id = p_reservation_id
    and user_id = p_user_id
    and status = 'reserved'
  returning quota_month into v_month;

  if v_month is null then
    raise exception 'Assessment quota reservation was not found.';
  end if;

  select count(*) into v_completed
  from public.psychosocial_assessment_generation_events
  where user_id = p_user_id
    and quota_month = v_month
    and status = 'completed';

  return jsonb_build_object(
    'monthlyLimit', p_monthly_limit,
    'successfulGenerationsThisMonth', v_completed,
    'remainingSuccessfulGenerations', greatest(p_monthly_limit - v_completed, 0)
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
    and user_id = p_user_id
    and status = 'reserved';
$$;

revoke all on function public.psychosocial_reserve_assessment_generation(uuid, text, integer, integer, integer, integer) from public;
revoke all on function public.psychosocial_complete_assessment_generation(uuid, uuid, integer) from public;
revoke all on function public.psychosocial_release_assessment_generation(uuid, uuid) from public;

grant execute on function public.psychosocial_reserve_assessment_generation(uuid, text, integer, integer, integer, integer) to service_role;
grant execute on function public.psychosocial_complete_assessment_generation(uuid, uuid, integer) to service_role;
grant execute on function public.psychosocial_release_assessment_generation(uuid, uuid) to service_role;
