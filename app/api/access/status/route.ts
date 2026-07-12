import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import {
  metadataHasAccess
} from "@/lib/supabase/accessMetadata";
import {
  isOwnerRole,
  metadataHasOwnerRole,
  normalizeAccountRole
} from "@/lib/supabase/ownerRole";

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

  if (error) {
    console.warn("Buyer profile table could not be read.", {
      code: error.code,
      message: error.message
    });

    return NextResponse.json({
      accessRole: metadataHasOwnerRole(appMetadata) ? "owner" : "buyer",
      agencyName: userMetadata.agency_name ?? null,
      email: user.email ?? null,
      fullName: userMetadata.full_name ?? null,
      hasAccess:
        metadataHasAccess(appMetadata) ||
        metadataHasOwnerRole(appMetadata),
      isOwner: metadataHasOwnerRole(appMetadata),
      username: userMetadata.username ?? null
    });
  }

  const profile =
    data ??
    (
      await admin
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
        .single<ProfileRow>()
    ).data;

  const owner = isOwnerRole({
    appMetadata,
    profileRole: profile?.account_role
  });

  return NextResponse.json({
    accessRole: owner ? "owner" : normalizeAccountRole(profile?.account_role),
    agencyName: profile?.agency_name ?? null,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    hasAccess: owner || Boolean(profile?.has_access) || metadataHasAccess(appMetadata),
    isOwner: owner,
    username: profile?.username ?? null
  });
}
