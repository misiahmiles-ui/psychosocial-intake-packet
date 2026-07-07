"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, KeyRound } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    [supabaseConfigured]
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase) {
      setMessage("Supabase account access is not configured yet.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Your password has been updated. You can now sign in.");
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
            Create a new password
          </h1>
          <p className="mt-2 leading-7 text-[#52645f]">
            Enter a new password for your agency access account.
          </p>
        </div>
      </div>

      {!supabaseConfigured ? (
        <div className="mt-5 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
          Supabase account access is not configured yet. Password reset will
          work after the Supabase environment variables are added.
        </div>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="field-label">
          New password
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="field-label">
          Confirm new password
          <input
            className="field-input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
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
          {isSubmitting ? "Updating..." : "Update password"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <p className="mt-5 text-sm font-semibold text-[#52645f]">
        Ready to continue?{" "}
        <Link className="font-bold text-sea hover:text-[#0b615b]" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
