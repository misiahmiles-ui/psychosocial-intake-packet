import { NextResponse } from "next/server";
import packageJson from "@/package.json";
import {
  createSupabaseAdminClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import { resolveOwnerAuthorization } from "@/lib/supabase/ownerRole";

type OwnerProfileRow = {
  account_role: string | null;
  agency_name: string | null;
  email: string | null;
  full_name: string | null;
  id: string;
  username: string | null;
};

export async function GET(request: Request) {
  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { error: "Supabase owner access is not configured." },
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

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,email,full_name,username,agency_name,account_role")
    .eq("id", user.id)
    .maybeSingle<OwnerProfileRow>();

  const appMetadata = user.app_metadata as Record<string, unknown>;
  const ownerAuthorization = resolveOwnerAuthorization({
    appMetadata,
    profileRole: profile?.account_role
  });

  if (profileError && !ownerAuthorization.isOwner) {
    console.warn("Owner profile table could not be read.", {
      code: profileError.code,
      message: profileError.message
    });
  }

  if (!ownerAuthorization.isOwner) {
    return NextResponse.json(
      { error: "Owner access is required." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    accountRole: ownerAuthorization.accountRole,
    authorizationSource: ownerAuthorization.source,
    deployment: {
      commit:
        process.env.COMMIT_REF ??
        process.env.HEAD ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        null,
      environment:
        process.env.CONTEXT ??
        process.env.NEXT_PUBLIC_NETLIFY_CONTEXT ??
        process.env.NODE_ENV ??
        "unknown",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? null
    },
    owner: {
      agencyName: profile?.agency_name ?? null,
      email: profile?.email ?? user.email ?? null,
      fullName: profile?.full_name ?? null,
      username: profile?.username ?? null
    },
    product: {
      name: "Adult Day Intake Pro",
      version: packageJson.version
    }
  });
}
