import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getBearerToken,
  hasSupabaseAdminConfig,
  hasSupabasePublicServerConfig
} from "@/lib/supabase/server";

type ProfileRow = {
  agency_name: string | null;
  email: string | null;
  full_name: string | null;
  has_access: boolean;
  id: string;
  username: string | null;
};

export async function GET(request: Request) {
  if (!hasSupabasePublicServerConfig() || !hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { error: "Supabase account access is not configured." },
      { status: 503 }
    );
  }

  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const authClient = createSupabaseServerClient(token);
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,email,full_name,username,agency_name,has_access")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    return NextResponse.json(
      { error: "Access profile could not be loaded." },
      { status: 500 }
    );
  }

  const metadata = user.user_metadata as {
    agency_name?: string;
    full_name?: string;
    username?: string;
  };

  const profile =
    data ??
    (
      await admin
        .from("profiles")
        .insert({
          agency_name: metadata.agency_name ?? null,
          email: user.email ?? null,
          full_name: metadata.full_name ?? null,
          id: user.id,
          username: metadata.username ?? null
        })
        .select("id,email,full_name,username,agency_name,has_access")
        .single<ProfileRow>()
    ).data;

  return NextResponse.json({
    agencyName: profile?.agency_name ?? null,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    hasAccess: Boolean(profile?.has_access),
    username: profile?.username ?? null
  });
}
