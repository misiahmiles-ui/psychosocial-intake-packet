import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import { metadataHasAccess } from "@/lib/supabase/accessMetadata";
import { resolveOwnerAuthorization } from "@/lib/supabase/ownerRole";
import {
  getSharedSuiteAccess,
  hasSharedSuiteAccessEnabled
} from "@/lib/supabase/sharedSuiteAccess";
import type {
  WorkflowAccess,
  WorkflowProduct
} from "@/lib/access/sharedSuiteRules";
import { hasCurrentLegalAcceptance } from "@/lib/legal/acceptance";
import { normalizeAuthorizedJurisdictions } from "@/lib/access/psychosocialJurisdictions";

const CURRENT_PRODUCT: WorkflowProduct = "psychosocial";

type ProfileRow = {
  agency_name: string | null;
  account_role: string | null;
  email: string | null;
  full_name: string | null;
  has_access: boolean;
  id: string;
  username: string | null;
};

export async function GET(request: Request) {
  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { error: "Supabase account access is not configured." },
      { status: 503 }
    );
  }

  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id,email,full_name,username,agency_name,account_role,has_access")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const appMetadata = user.app_metadata as Record<string, unknown>;
  const userMetadata = user.user_metadata as {
    agency_name?: string;
    full_name?: string;
    username?: string;
  };

  let profile = data;

  if (error) {
    console.warn("Buyer profile table could not be read.", {
      code: error.code,
      message: error.message
    });
  } else if (!profile) {
    const { data: createdProfile, error: profileCreateError } = await admin
      .from("profiles")
      .upsert({
        account_role: "buyer",
        agency_name: userMetadata.agency_name ?? null,
        email: user.email ?? null,
        full_name: userMetadata.full_name ?? null,
        id: user.id,
        username: userMetadata.username ?? null
      })
      .select("id,email,full_name,username,agency_name,account_role,has_access")
      .single<ProfileRow>();

    if (profileCreateError) {
      console.warn("Buyer profile table could not be created.", {
        code: profileCreateError.code,
        message: profileCreateError.message
      });
    }

    profile = createdProfile;
  }

  const ownerAuthorization = resolveOwnerAuthorization({
    appMetadata,
    profileRole: profile?.account_role
  });

  if (!ownerAuthorization.isOwner) {
    try {
      const legalAccepted = await hasCurrentLegalAcceptance(admin, user.id);
      if (!legalAccepted) {
        return NextResponse.json({
          email: profile?.email ?? user.email ?? null,
          hasAccess: false,
          isOwner: false,
          requiresLegalAcceptance: true,
          workflowAccess: { nursing: false, psychosocial: false }
        });
      }
    } catch (legalError) {
      console.error("Legal acceptance could not be verified.", legalError);
      return NextResponse.json(
        { error: "Legal acceptance could not be verified." },
        { status: 503 }
      );
    }
  }

  let sharedAccess: Awaited<ReturnType<typeof getSharedSuiteAccess>> | null =
    null;

  if (hasSharedSuiteAccessEnabled() && !ownerAuthorization.isOwner) {
    try {
      sharedAccess = await getSharedSuiteAccess(admin, user.id);
    } catch (sharedAccessError) {
      console.error("Shared facility access could not be checked.", sharedAccessError);
      return NextResponse.json(
        { error: "Shared facility access could not be checked." },
        { status: 503 }
      );
    }
  }

  const legacyHasAccess =
    Boolean(profile?.has_access) || metadataHasAccess(appMetadata);
  const workflowAccess: WorkflowAccess = ownerAuthorization.isOwner
    ? { nursing: true, psychosocial: true }
    : sharedAccess?.workflowAccess ?? legacyWorkflowAccess(legacyHasAccess);
  const psychosocialJurisdictions = normalizeAuthorizedJurisdictions(
    appMetadata.psychosocial_jurisdictions ??
      appMetadata.psychosocial_jurisdiction,
    ownerAuthorization.isOwner
  );

  return NextResponse.json({
    accessRole: ownerAuthorization.accountRole,
    authorizationSource: sharedAccess
      ? "shared_facility_membership"
      : ownerAuthorization.source,
    agencyName: profile?.agency_name ?? null,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? userMetadata.full_name ?? null,
    hasAccess: ownerAuthorization.isOwner || workflowAccess[CURRENT_PRODUCT],
    isOwner: ownerAuthorization.isOwner,
    organizationId: sharedAccess?.organizationId ?? null,
    organizationName: sharedAccess?.organizationName ?? null,
    organizationRole: sharedAccess?.organizationRole ?? null,
    psychosocialJurisdictions,
    seatLimits: sharedAccess?.seatLimits ?? null,
    subscriptionPlan: sharedAccess?.subscriptionPlan ?? null,
    username: profile?.username ?? userMetadata.username ?? null,
    workflowAccess
  });
}

function legacyWorkflowAccess(hasAccess: boolean): WorkflowAccess {
  return {
    nursing: CURRENT_PRODUCT === "nursing" && hasAccess,
    psychosocial: CURRENT_PRODUCT === "psychosocial" && hasAccess
  };
}
