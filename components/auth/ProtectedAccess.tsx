"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/browser";
import type {
  SubscriptionPlan,
  WorkflowAccess,
  WorkflowProduct
} from "@/lib/access/sharedSuiteRules";

const CURRENT_PRODUCT: WorkflowProduct = "psychosocial";

export type ActiveAccessDetails = {
  email: string | null;
  isOwner: boolean;
  organizationName: string | null;
  subscriptionPlan: SubscriptionPlan | null;
  workflowAccess: WorkflowAccess;
};

type AccessStatus =
  | { state: "loading" }
  | { state: "signed-out" }
  | { state: "needs-payment"; email: string | null }
  | ({ state: "active" } & ActiveAccessDetails)
  | { state: "setup-missing" }
  | { state: "error"; message: string };

type ProtectedAccessProps = {
  children: ReactNode | ((access: ActiveAccessDetails) => ReactNode);
};

export function ProtectedAccess({ children }: ProtectedAccessProps) {
  const router = useRouter();
  const supabaseConfigured = hasSupabaseBrowserConfig();
  const supabase = useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    [supabaseConfigured]
  );
  const [status, setStatus] = useState<AccessStatus>(
    supabaseConfigured ? { state: "loading" } : { state: "setup-missing" }
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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

    const response = await fetch("/api/access/status", {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setStatus({
        state: "error",
        message:
          data?.error ??
          "Access status could not be checked. Please sign out and sign back in, then try again."
      });
      return;
    }

    const data = (await response.json()) as {
      hasAccess: boolean;
      email: string | null;
      isOwner?: boolean;
      organizationName?: string | null;
      subscriptionPlan?: SubscriptionPlan | null;
      workflowAccess?: WorkflowAccess;
    };

    const workflowAccess = data.workflowAccess ?? {
      nursing: CURRENT_PRODUCT === "nursing" && data.hasAccess,
      psychosocial: CURRENT_PRODUCT === "psychosocial" && data.hasAccess
    };

    setStatus(
      data.hasAccess
        ? {
            state: "active",
            email: data.email,
            isOwner: data.isOwner === true,
            organizationName: data.organizationName ?? null,
            subscriptionPlan: data.subscriptionPlan ?? null,
            workflowAccess
          }
        : { state: "needs-payment", email: data.email }
    );
  }, [supabase]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function handleCheckout() {
    if (!supabase) return;

    setIsCheckingOut(true);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus({ state: "signed-out" });
        return;
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus({
          state: "error",
          message:
            data?.error ??
            "Stripe checkout could not be started. Confirm Stripe settings are configured."
        });
        return;
      }

      const data = (await response.json()) as { url: string };
      window.location.assign(data.url);
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (status.state === "active") {
    return (
      <>
        <div className="no-print border-b border-[#d7dfdc] bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm sm:px-8 lg:px-10">
            <p className="font-semibold text-[#52645f]">
              Signed in{status.email ? ` as ${status.email}` : ""}.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {status.isOwner ? (
                <>
                  <span className="rounded-full border border-[#cde7df] bg-mint px-3 py-1 font-bold text-sea">
                    Product Owner Access &mdash; No Subscription Required
                  </span>
                  <Link
                    className="font-bold text-sea hover:text-[#0b615b]"
                    href="/owner"
                  >
                    Owner Control Center
                  </Link>
                </>
              ) : null}
              <button
                className="font-bold text-sea hover:text-[#0b615b]"
                type="button"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
        {typeof children === "function" ? children(status) : children}
      </>
    );
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
                Protected workflow access
              </h1>
              <p className="mt-2 leading-7 text-[#52645f]">
                Sign in and complete Standard Agency Access to use the hosted
                Adult Day Intake Pro™ workflow.
              </p>
            </div>
          </div>

          {status.state === "loading" ? (
            <p className="mt-5 rounded-lg border border-[#d7dfdc] bg-[#fbfcfb] p-4 font-semibold text-[#52645f]">
              Checking access...
            </p>
          ) : null}

          {status.state === "setup-missing" ? (
            <div className="mt-5 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
              Account access is not configured yet. Add Supabase and Stripe
              environment variables in Netlify before launch. The local PDF
              export workflow remains no-retention.
            </div>
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
                href="/signup"
              >
                Create account
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/psychosocial-intake-packet"
              >
                View product page
              </Link>
            </div>
          ) : null}

          {status.state === "needs-payment" ? (
            <div className="mt-5">
              <div className="rounded-lg border border-[#f0d3c8] bg-[#fff8f5] p-4">
                <h2 className="font-bold text-clay">
                  Standard Agency Access - $487 + $19/month
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#643524]">
                  This account is created, but payment has not been confirmed.
                  Complete the upfront access payment and monthly hosted access
                  subscription to unlock the hosted workflow dashboard.
                </p>
              </div>
              <button
                className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {isCheckingOut
                  ? "Opening checkout..."
                  : "Purchase Standard Agency Access"}
              </button>
            </div>
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
                Supabase stores buyer account and access status only. Workflow
                responses remain local to the current browser session until the
                user downloads, exports, or prints a PDF.
              </span>
            </p>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#52645f]">
            Looking for the product page?{" "}
            <Link
              className="font-bold text-sea hover:text-[#0b615b]"
              href="/psychosocial-intake-packet"
            >
              Open Adult Day Intake Pro™
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
