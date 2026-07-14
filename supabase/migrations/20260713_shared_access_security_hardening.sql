begin;

-- Additive least-privilege hardening for the shared facility/account functions.
-- This changes function execution permissions only; it grants no product access.

alter function public.set_updated_at()
  set search_path = pg_catalog;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user_profile()
  from public, anon, authenticated;
revoke all on function public.enforce_workflow_seat_limit()
  from public, anon, authenticated;
revoke all on function public.prevent_entitlement_below_usage()
  from public, anon, authenticated;
revoke all on function public.rls_auto_enable()
  from public, anon, authenticated;

revoke all on function public.is_product_owner(uuid)
  from public, anon, authenticated;
revoke all on function public.is_active_organization_member(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.is_facility_admin(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.is_product_owner(uuid)
  to authenticated;
grant execute on function public.is_active_organization_member(uuid, uuid)
  to authenticated;
grant execute on function public.is_facility_admin(uuid, uuid)
  to authenticated;

commit;
