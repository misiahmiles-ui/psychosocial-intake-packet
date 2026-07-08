"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, LockKeyhole, UserPlus } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/browser";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    [supabaseConfigured]
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase) {
      setMessage("Supabase is not configured yet for account access.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          body: JSON.stringify({
            agencyName,
            email,
            fullName,
            password,
            username
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setMessage(data?.error ?? "Account could not be created.");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setMessage(
            "Account created, but automatic sign-in did not complete. Please sign in to continue."
          );
          return;
        }

        setMessage(
          "Account created. Continue to the dashboard to complete payment."
        );
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint text-sea">
          {mode === "signup" ? (
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          ) : (
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-normal">
            {mode === "signup" ? "Create agency access" : "Sign in"}
          </h1>
          <p className="mt-2 leading-7 text-[#52645f]">
            {mode === "signup"
              ? "Create the account your agency will use to access the hosted workflow."
              : "Sign in to access the Adult Day Intake Pro™ dashboard."}
          </p>
        </div>
      </div>

      {!supabaseConfigured ? (
        <div className="mt-5 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
          Supabase account access is not configured yet. Add the Supabase URL
          and anon key in Netlify environment variables before using sign in.
        </div>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <>
            <label className="field-label">
              Full name
              <input
                className="field-input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="field-label">
              Username
              <input
                className="field-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="field-label">
              Agency or facility name
              <input
                className="field-input"
                value={agencyName}
                onChange={(event) => setAgencyName(event.target.value)}
                autoComplete="organization"
                required
              />
            </label>
          </>
        ) : null}

        <label className="field-label">
          Email
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="field-label">
          <span className="flex items-center justify-between gap-3">
            <span>Password</span>
            {mode === "login" ? (
              <Link
                className="text-sm font-bold text-sea hover:text-[#0b615b]"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            ) : null}
          </span>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>

        {message ? (
          <p className="flex gap-2 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-3 text-sm font-semibold leading-6 text-[#643524]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </p>
        ) : null}

        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting || !supabaseConfigured}
        >
          {isSubmitting
            ? "Working..."
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-5 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
        Account access stores buyer login and purchase status only. Client,
        member, participant, logo, and workflow responses are not saved to
        Supabase through the intake workflow.
      </div>

      <p className="mt-5 text-sm font-semibold text-[#52645f]">
        {mode === "signup" ? "Already have an account?" : "Need access?"}{" "}
        <Link
          className="font-bold text-sea hover:text-[#0b615b]"
          href={mode === "signup" ? "/login" : "/signup"}
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <p className="mt-3 text-sm font-semibold text-[#52645f]">
        Looking for the product page?{" "}
        <Link
          className="font-bold text-sea hover:text-[#0b615b]"
          href="/psychosocial-intake-packet"
        >
            View it here
        </Link>
      </p>
    </div>
  );
}
