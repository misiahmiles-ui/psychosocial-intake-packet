import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";

type SignupPayload = {
  agencyName?: unknown;
  email?: unknown;
  fullName?: unknown;
  password?: unknown;
  username?: unknown;
};

export async function POST(request: Request) {
  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { error: "Supabase account setup is not configured." },
      { status: 503 }
    );
  }

  const payload = (await request.json().catch(() => null)) as SignupPayload | null;
  const email = cleanValue(payload?.email).toLowerCase();
  const password = typeof payload?.password === "string" ? payload.password : "";
  const fullName = cleanValue(payload?.fullName);
  const username = cleanValue(payload?.username);
  const agencyName = cleanValue(payload?.agencyName);

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (!fullName || !username || !agencyName) {
    return NextResponse.json(
      { error: "Full name, username, and agency name are required." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      agency_name: agencyName,
      full_name: fullName,
      username
    }
  });

  if (error) {
    const alreadyRegistered = /already|registered|exists/i.test(error.message);

    return NextResponse.json(
      {
        error: alreadyRegistered
          ? "An account already exists for this email. Sign in instead."
          : error.message
      },
      { status: alreadyRegistered ? 409 : 400 }
    );
  }

  if (data.user?.id) {
    await admin.from("profiles").upsert({
      agency_name: agencyName,
      email,
      full_name: fullName,
      id: data.user.id,
      username,
      updated_at: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true });
}

function cleanValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
