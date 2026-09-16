import "server-only";

import type { AssessmentEntitlementActivation } from "@/lib/assessmentUsage";
import { hasCurrentLegalAcceptance } from "@/lib/legal/acceptance";
import { metadataHasAccess } from "@/lib/supabase/accessMetadata";
import { resolveOwnerAuthorization } from "@/lib/supabase/ownerRole";
import {
  getSharedSuiteAccess,
  hasSharedSuiteAccessEnabled
} from "@/lib/supabase/sharedSuiteAccess";
import {
  createSupabaseAdminClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";

type AccessResult =
  | {
      authorized: true;
      entitlementActivation: AssessmentEntitlementActivation | null;
      isOwner: boolean;
      userId: string;
    }
  | { authorized: false; error: string; status: number };

type ProfileAccessRow = {
  account_role: string | null;
  access_granted_at: string | null;
  has_access: boolean;
  stripe_checkout_session_id: string | null;
};

export function requestIsSameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = new Set<string>([new URL(request.url).origin]);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      allowedOrigins.add(new URL(configuredSiteUrl).origin);
    } catch {
      return false;
    }
  }
  return allowedOrigins.has(origin);
}

export async function authorizeAssessmentGeneration(
  request: Request
): Promise<AccessResult> {
  if (!hasSupabaseAdminConfig()) {
    return {
      authorized: false,
      error: "Assessment generation account access is not configured.",
      status: 503
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { authorized: false, error: "Not signed in.", status: 401 };
  }

  const admin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError
  } = await admin.auth.getUser(token);
  if (userError || !user) {
    return { authorized: false, error: "Not signed in.", status: 401 };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "account_role,access_granted_at,has_access,stripe_checkout_session_id"
    )
    .eq("id", user.id)
    .maybeSingle<ProfileAccessRow>();

  const appMetadata = user.app_metadata as Record<string, unknown>;
  const owner = resolveOwnerAuthorization({
    appMetadata,
    profileRole: profile?.account_role
  });
  if (owner.isOwner) {
    return {
      authorized: true,
      entitlementActivation: null,
      isOwner: true,
      userId: user.id
    };
  }

  if (profileError) {
    return {
      authorized: false,
      error: "Account access could not be verified.",
      status: 503
    };
  }

  try {
    if (!(await hasCurrentLegalAcceptance(admin, user.id))) {
      return {
        authorized: false,
        error: "Current legal terms must be accepted before using assessment generation.",
        status: 403
      };
    }

    if (hasSharedSuiteAccessEnabled()) {
      const sharedAccess = await getSharedSuiteAccess(admin, user.id);
      if (!sharedAccess.workflowAccess.psychosocial) {
        return {
          authorized: false,
          error: "Psychosocial workflow access is required.",
          status: 403
        };
      }
      return {
        authorized: true,
        entitlementActivation: sharedAccess.purchaseActivation
          ? {
              kind: "organization",
              organizationId: sharedAccess.organizationId as string,
              ...sharedAccess.purchaseActivation
            }
          : null,
        isOwner: false,
        userId: user.id
      };
    }
  } catch {
    return {
      authorized: false,
      error: "Account access could not be verified.",
      status: 503
    };
  }

  if (!profile?.has_access && !metadataHasAccess(appMetadata)) {
    return {
      authorized: false,
      error: "Psychosocial workflow access is required.",
      status: 403
    };
  }

  const checkoutSessionId =
    profile?.stripe_checkout_session_id ??
    metadataString(appMetadata.stripe_checkout_session_id);
  const accessGrantedAt =
    profile?.access_granted_at ?? metadataString(appMetadata.access_granted_at);

  return {
    authorized: true,
    entitlementActivation:
      checkoutSessionId && accessGrantedAt
        ? {
            kind: "user",
            purchaseReference: `stripe-checkout:${checkoutSessionId}`,
            startsAt: accessGrantedAt,
            userId: user.id
          }
        : null,
    isOwner: false,
    userId: user.id
  };
}

function metadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
