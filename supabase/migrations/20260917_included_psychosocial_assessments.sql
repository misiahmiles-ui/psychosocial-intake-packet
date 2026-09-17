begin;

lock table public.psychosocial_assessment_generation_entitlements
  in share row exclusive mode;

-- Production has one previously granted 30-assessment initial pool and no
-- Stripe customers. Align only that verified entitlement. In a fresh database
-- with no entitlement rows, there is nothing to align. Any other populated
-- state fails closed rather than changing an unexpected customer's allowance.
do $$
declare
  v_entitlement_id uuid := '3bbf1056-9f50-4f60-a87f-b9eb23858a17';
  v_previous_quantity integer;
  v_completed integer;
  v_reserved integer;
  v_released integer;
  v_updated integer;
begin
  if exists (select 1 from public.psychosocial_assessment_generation_entitlements) then
    if (select count(*) from public.psychosocial_assessment_generation_entitlements) <> 1 then
      raise exception 'Unexpected assessment entitlement count; no quantity changed.';
    end if;

    select included_quantity into v_previous_quantity
    from public.psychosocial_assessment_generation_entitlements
    where id = v_entitlement_id
      and entitlement_kind = 'initial_purchase'
      and included_quantity in (25, 30)
      and now() >= starts_at
      and now() < expires_at
    for update;
    if not found then
      raise exception 'Expected active assessment entitlement not found; no quantity changed.';
    end if;

    select
      count(*) filter (where status = 'completed'),
      count(*) filter (where status = 'reserved'),
      count(*) filter (where status = 'released')
    into v_completed, v_reserved, v_released
    from public.psychosocial_assessment_generation_events
    where entitlement_id = v_entitlement_id;
    if v_completed <> 1 or v_reserved <> 0 or v_released <> 1 then
      raise exception 'Unexpected assessment usage state; no quantity changed.';
    end if;

    if v_previous_quantity = 30 then
      update public.psychosocial_assessment_generation_entitlements
      set included_quantity = 25
      where id = v_entitlement_id and included_quantity = 30;
      get diagnostics v_updated = row_count;
      if v_updated <> 1 then
        raise exception 'Expected one entitlement update; no quantity changed.';
      end if;
    end if;
  end if;
end;
$$;

-- Subsequent checkout and paid renewal paths already request 25 for each
-- newly created entitlement. No usage event or historical row is changed.
-- An AFTER INSERT trigger checks only rows that were actually inserted. It
-- therefore also permits an idempotent replay of a legacy 30-use purchase.
create or replace function public.psychosocial_require_25_new_assessment_entitlement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.included_quantity <> 25 then
    raise exception 'New assessment entitlements must include exactly 25 assessments.';
  end if;
  return new;
end;
$$;

revoke all on function public.psychosocial_require_25_new_assessment_entitlement()
  from public;
grant execute on function public.psychosocial_require_25_new_assessment_entitlement()
  to service_role;

drop trigger if exists psychosocial_require_25_new_assessment_entitlement
  on public.psychosocial_assessment_generation_entitlements;

create trigger psychosocial_require_25_new_assessment_entitlement
after insert on public.psychosocial_assessment_generation_entitlements
for each row
execute function public.psychosocial_require_25_new_assessment_entitlement();

-- The current grant request contains 25. A repeated webhook for an existing
-- 30-use purchase must return that same entitlement without changing it. All
-- other owner, Stripe, reference, kind, and window comparisons remain strict.
create or replace function public.psychosocial_grant_assessment_generation_entitlement(
  p_organization_id uuid,
  p_user_id uuid,
  p_entitlement_kind text,
  p_purchase_reference text,
  p_stripe_subscription_id text,
  p_stripe_invoice_id text,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_included_quantity integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement_id uuid;
begin
  if num_nonnulls(p_organization_id, p_user_id) <> 1
    or p_entitlement_kind not in ('initial_purchase', 'recurring_billing_cycle')
    or length(trim(coalesce(p_purchase_reference, ''))) = 0
    or p_starts_at is null
    or p_expires_at is null
    or p_expires_at <= p_starts_at
    or p_included_quantity < 1
    or p_included_quantity > 1000
    or (
      p_entitlement_kind = 'initial_purchase'
      and (p_stripe_subscription_id is not null or p_stripe_invoice_id is not null)
    )
    or (
      p_entitlement_kind = 'recurring_billing_cycle'
      and (
        length(trim(coalesce(p_stripe_subscription_id, ''))) = 0
        or length(trim(coalesce(p_stripe_invoice_id, ''))) = 0
      )
    ) then
    raise exception 'Invalid assessment generation entitlement parameters.';
  end if;

  insert into public.psychosocial_assessment_generation_entitlements (
    organization_id,
    user_id,
    entitlement_kind,
    purchase_reference,
    stripe_subscription_id,
    stripe_invoice_id,
    included_quantity,
    starts_at,
    expires_at
  ) values (
    p_organization_id,
    p_user_id,
    p_entitlement_kind,
    trim(p_purchase_reference),
    nullif(trim(coalesce(p_stripe_subscription_id, '')), ''),
    nullif(trim(coalesce(p_stripe_invoice_id, '')), ''),
    p_included_quantity,
    p_starts_at,
    p_expires_at
  )
  on conflict (purchase_reference) do nothing
  returning id into v_entitlement_id;

  if v_entitlement_id is null then
    select entitlement.id into v_entitlement_id
    from public.psychosocial_assessment_generation_entitlements entitlement
    where entitlement.purchase_reference = trim(p_purchase_reference)
      and entitlement.organization_id is not distinct from p_organization_id
      and entitlement.user_id is not distinct from p_user_id
      and entitlement.entitlement_kind = p_entitlement_kind
      and entitlement.stripe_subscription_id
        is not distinct from nullif(trim(coalesce(p_stripe_subscription_id, '')), '')
      and entitlement.stripe_invoice_id
        is not distinct from nullif(trim(coalesce(p_stripe_invoice_id, '')), '')
      and (
        entitlement.included_quantity = p_included_quantity
        or (entitlement.included_quantity = 30 and p_included_quantity = 25)
      )
      and entitlement.starts_at = p_starts_at
      and entitlement.expires_at = p_expires_at;
  end if;

  if v_entitlement_id is null then
    raise exception 'The entitlement reference is already bound to another record.';
  end if;

  return v_entitlement_id;
end;
$$;

commit;
