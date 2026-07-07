import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import {
  metadataHasAccess
} from "@/lib/supabase/accessMetadata";

type ProfileRow = {
  agency_name: string | null;
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
    .select("id,email,full_name,username,agency_name,has_access")
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
      agencyName: userMetadata.agency_name ?? null,
      email: user.email ?? null,
      fullName: userMetadata.full_name ?? null,
      hasAccess: metadataHasAccess(appMetadata),
      username: userMetadata.username ?? null
    });
  }

  const profile =
    data ??
    (
      await admin
        .from("profiles")
        .upsert({
          agency_name: userMetadata.agency_name ?? null,
          email: user.email ?? null,
          full_name: userMetadata.full_name ?? null,
          id: user.id,
          username: userMetadata.username ?? null
        })
        .select("id,email,full_name,username,agency_name,has_access")
        .single<ProfileRow>()
    ).data;

  return NextResponse.json({
    agencyName: profile?.agency_name ?? null,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    hasAccess: Boolean(profile?.has_access) || metadataHasAccess(appMetadata),
    username: profile?.username ?? null
  });
}
