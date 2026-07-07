"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, KeyRound } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/browser";

export function ForgotPasswordForm() {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    [supabaseConfigured]
  );
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase) {
      setMessage("Supabase account access is not configured yet.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "If an account exists for that email, a password reset link has been sent."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint text-sea">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-normal">
            Reset your password
          </h1>
          <p className="mt-2 leading-7 text-[#52645f]">
            Enter the email connected to your agency access account.
          </p>
        </div>
      </div>

      {!supabaseConfigured ? (
        <div className="mt-5 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
          Supabase account access is not configured yet. Password reset emails
          will work after the Supabase environment variables are added.
        </div>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
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
          {isSubmitting ? "Sending..." : "Send reset link"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <p className="mt-5 text-sm font-semibold text-[#52645f]">
        Remember your password?{" "}
        <Link className="font-bold text-sea hover:text-[#0b615b]" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
