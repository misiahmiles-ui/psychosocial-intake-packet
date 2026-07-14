import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import { recordCurrentLegalAcceptance } from "@/lib/legal/acceptance";

type AcceptancePayload = {
  acknowledgedPrivacy?: unknown;
  agreedToTerms?: unknown;
};

export async function POST(request: Request) {
  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { error: "Legal acceptance storage is not configured." },
      { status: 503 }
    );
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | AcceptancePayload
    | null;
  if (
    payload?.agreedToTerms !== true ||
    payload.acknowledgedPrivacy !== true
  ) {
    return NextResponse.json(
      { error: "Accept the Terms and acknowledge the Privacy Policy." },
      { status: 400 }
    );
  }

  const auth = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await auth.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    await recordCurrentLegalAcceptance(createSupabaseAdminClient(), {
      context: "existing_user",
      sourceApp: "psychosocial",
      userId: user.id
    });
  } catch (acceptanceError) {
    console.error("Legal acceptance could not be recorded.", acceptanceError);
    return NextResponse.json(
      { error: "Your acceptance could not be recorded right now." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
