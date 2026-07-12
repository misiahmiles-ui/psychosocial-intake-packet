"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/browser";

type OwnerStatus =
  | { state: "loading" }
  | { state: "signed-out" }
  | { state: "denied" }
  | { state: "active"; data: OwnerStatusData }
  | { state: "setup-missing" }
  | { state: "error"; message: string };

export type OwnerStatusData = {
  accountRole: "owner";
  deployment: {
    commit: string | null;
    environment: string;
    siteUrl: string | null;
  };
  owner: {
    agencyName: string | null;
    email: string | null;
    fullName: string | null;
    username: string | null;
  };
  product: {
    name: string;
    version: string;
  };
};

type OwnerAccessProps = {
  children: (data: OwnerStatusData) => ReactNode;
};

export function OwnerAccess({ children }: OwnerAccessProps) {
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    [supabaseConfigured]
  );
  const [status, setStatus] = useState<OwnerStatus>(
    supabaseConfigured ? { state: "loading" } : { state: "setup-missing" }
  );

  const refreshStatus = useCallback(async () => {
    if (!supabase) {
      setStatus({ state: "setup-missing" });
      return;
    }

    setStatus({ state: "loading" });
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      setStatus({ state: "error", message: sessionError.message });
      return;
    }

    if (!session) {
      setStatus({ state: "signed-out" });
      return;
    }

    let response: Response;
    try {
      response = await fetch("/api/owner/status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
    } catch {
      setStatus({
        state: "error",
        message:
          "Owner access could not be checked. Confirm the site is online and try again."
      });
      return;
    }

    if (response.status === 403) {
      setStatus({ state: "denied" });
      return;
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setStatus({
        state: "error",
        message:
          data?.error ??
          "Owner access could not be verified. Sign out and sign in again, then try again."
      });
      return;
    }

    setStatus({ state: "active", data: (await response.json()) as OwnerStatusData });
  }, [supabase]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  if (status.state === "active") {
    return <>{children(status.data)}</>;
  }

  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-10 sm:px-8">
        <div className="w-full rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint text-sea">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-normal">
                Owner access required
              </h1>
              <p className="mt-2 leading-7 text-[#52645f]">
                The Owner Control Center is available only to the authenticated
                Product Owner / Super Administrator account.
              </p>
            </div>
          </div>

          {status.state === "loading" ? (
            <p className="mt-5 rounded-lg border border-[#d7dfdc] bg-[#fbfcfb] p-4 font-semibold text-[#52645f]">
              Checking owner role...
            </p>
          ) : null}

          {status.state === "setup-missing" ? (
            <OwnerMessage>
              Supabase owner access is not configured yet. Configure Supabase
              environment variables before using owner access.
            </OwnerMessage>
          ) : null}

          {status.state === "signed-out" ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b]"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/psychosocial-intake-packet"
              >
                View product page
              </Link>
            </div>
          ) : null}

          {status.state === "denied" ? (
            <OwnerMessage>
              This signed-in account is not marked as Product Owner / Super
              Administrator.
            </OwnerMessage>
          ) : null}

          {status.state === "error" ? (
            <div className="mt-5 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
              <p className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{status.message}</span>
              </p>
              <button
                className="mt-3 font-bold text-sea hover:text-[#0b615b]"
                type="button"
                onClick={() => void refreshStatus()}
              >
                Try again
              </button>
            </div>
          ) : null}

          <div className="mt-5 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sea" />
              <span>
                Owner authorization is verified by the server against Supabase
                role data. Intake workflow responses are not stored.
              </span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function OwnerMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
      {children}
    </div>
  );
}
