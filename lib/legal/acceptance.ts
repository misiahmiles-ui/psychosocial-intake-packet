import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { PRIVACY_VERSION, TERMS_VERSION } from "./productFamilyLegal";

export type LegalAcceptanceContext =
  | "facility_signup"
  | "existing_user"
  | "staff_invitation";

export type LegalSourceApp = "nursing" | "psychosocial";

export async function hasCurrentLegalAcceptance(
  admin: SupabaseClient,
  userId: string
) {
  const { data, error } = await admin
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version", TERMS_VERSION)
    .eq("privacy_version", PRIVACY_VERSION)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Legal acceptance could not be verified: ${error.message}`);
  }

  return Boolean(data);
}

export async function recordCurrentLegalAcceptance(
  admin: SupabaseClient,
  input: {
    context: LegalAcceptanceContext;
    sourceApp: LegalSourceApp;
    userId: string;
  }
) {
  if (await hasCurrentLegalAcceptance(admin, input.userId)) return;

  const { data: membership, error: membershipError } = await admin
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .maybeSingle<{ organization_id: string; role: string }>();

  if (membershipError) {
    throw new Error(`Legal acceptance facility could not be verified: ${membershipError.message}`);
  }

  const { error } = await admin.from("legal_acceptances").insert({
    acceptance_context: input.context,
    authority_to_bind_facility: membership?.role === "facility_admin",
    organization_id: membership?.organization_id ?? null,
    privacy_version: PRIVACY_VERSION,
    source_app: input.sourceApp,
    terms_version: TERMS_VERSION,
    user_id: input.userId
  });

  if (error && error.code !== "23505") {
    throw new Error(`Legal acceptance could not be recorded: ${error.message}`);
  }
}
