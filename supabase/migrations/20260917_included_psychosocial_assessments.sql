begin;

-- Keep the existing private quota ledger and completed events. Existing
-- 30-use pools must not remain a larger allowance after the product changes.
update public.psychosocial_assessment_generation_entitlements
set included_quantity = 25
where included_quantity <> 25;

commit;
