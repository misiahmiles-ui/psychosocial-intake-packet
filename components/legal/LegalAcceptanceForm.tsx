"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/browser";
import {
  PRIVACY_VERSION,
  TERMS_VERSION
} from "@/lib/legal/productFamilyLegal";

export function LegalAcceptanceForm() {
  const router = useRouter();
  const configured = hasSupabaseBrowserConfig();
  const supabase = useMemo(
    () => (configured ? createSupabaseBrowserClient() : null),
    [configured]
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!agreedToTerms || !acknowledgedPrivacy) {
      setMessage("Review and accept both documents to continue.");
      return;
    }

    if (!supabase) {
      setMessage("Account access is not configured.");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?next=/legal/accept");
        return;
      }

      const response = await fetch("/api/legal/accept", {
        body: JSON.stringify({
          acknowledgedPrivacy,
          agreedToTerms
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(data?.error ?? "Your acceptance could not be recorded.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d7dfdc] bg-white p-4 leading-6 shadow-sm">
        <input
          aria-describedby="terms-version"
          checked={agreedToTerms}
          className="mt-1 h-5 w-5 shrink-0 accent-[#137d78]"
          onChange={(event) => setAgreedToTerms(event.target.checked)}
          required
          type="checkbox"
        />
        <span>
          <span className="font-bold text-[#173b59]">
            I have read and agree to the{" "}
            <Link className="text-sea underline" href="/terms" target="_blank">
              Terms of Service
            </Link>
            .
          </span>{" "}
          If I purchase or administer access for a facility, I confirm that I
          am authorized to bind that facility.
          <span className="mt-1 block text-sm text-[#52645f]" id="terms-version">
            Terms version {TERMS_VERSION}
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d7dfdc] bg-white p-4 leading-6 shadow-sm">
        <input
          aria-describedby="privacy-version"
          checked={acknowledgedPrivacy}
          className="mt-1 h-5 w-5 shrink-0 accent-[#137d78]"
          onChange={(event) => setAcknowledgedPrivacy(event.target.checked)}
          required
          type="checkbox"
        />
        <span>
          <span className="font-bold text-[#173b59]">
            I acknowledge the{" "}
            <Link className="text-sea underline" href="/privacy" target="_blank">
              Privacy Policy
            </Link>
            .
          </span>{" "}
          I understand that participant information must not be entered into
          account, billing, or support channels.
          <span className="mt-1 block text-sm text-[#52645f]" id="privacy-version">
            Privacy version {PRIVACY_VERSION}
          </span>
        </span>
      </label>

      {message ? (
        <p className="flex gap-2 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-3 text-sm font-semibold leading-6 text-[#643524]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={
          submitting || !configured || !agreedToTerms || !acknowledgedPrivacy
        }
        type="submit"
      >
        {submitting ? "Recording acceptance..." : "Accept and continue"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <p className="flex gap-2 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sea" aria-hidden="true" />
        <span>
          The acceptance record contains account, facility, document-version,
          source-app, and timestamp information only. It never contains
          participant or intake-form responses.
        </span>
      </p>
    </form>
  );
}
