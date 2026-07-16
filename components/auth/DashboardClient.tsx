"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import {
  ProtectedAccess,
  type ActiveAccessDetails
} from "@/components/auth/ProtectedAccess";

const NURSING_DASHBOARD_URL =
  "https://adult-day-nursing-intake-pro.vercel.app/dashboard";
const FACILITY_ACCOUNT_URL =
  "https://adult-day-nursing-intake-pro.vercel.app/account";

export function DashboardClient() {
  return (
    <ProtectedAccess>
      {(access) => <DashboardContent access={access} />}
    </ProtectedAccess>
  );
}

function DashboardContent({ access }: { access: ActiveAccessDetails }) {
  const hasBothWorkflows =
    access.workflowAccess.psychosocial && access.workflowAccess.nursing;
  const psychosocialJurisdictions = access.psychosocialJurisdictions.length
    ? access.psychosocialJurisdictions
    : (["NJ"] as const);
  const hasMultiplePsychosocialEditions = psychosocialJurisdictions.length > 1;

  return (
      <main className="min-h-screen bg-cloud text-ink">
        <section className="border-b border-[#d7dfdc] bg-linen">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sea">
              {access.subscriptionPlan === "complete_suite"
                ? "Complete Suite Access"
                : "Facility Workflow Access"}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal">
              Adult Day Intake Pro™ Dashboard
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#52645f]">
              Start a new workflow or open the fictitious example. The
              documentation workflow does not save client/member assessment
              data to Supabase or Netlify.
            </p>
            {access.organizationName ? (
              <p className="mt-2 font-semibold text-[#52645f]">
                Facility: {access.organizationName}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              {access.workflowAccess.psychosocial ? (
                <>
                  {psychosocialJurisdictions.map((jurisdiction) => (
                    <Link
                      key={jurisdiction}
                      className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b]"
                      href={`/intake?edition=${jurisdiction}`}
                    >
                      {hasMultiplePsychosocialEditions
                        ? `Start ${jurisdiction === "MD" ? "Maryland" : "New Jersey"} Psychosocial Intake`
                        : "Start Psychosocial Intake"}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ))}
                  <Link
                    className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                    href="/example"
                  >
                    View Psychosocial Example
                  </Link>
                </>
              ) : null}
              {access.workflowAccess.nursing ? (
                <a
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                  href={NURSING_DASHBOARD_URL}
                >
                  Open Nursing Workflow
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {access.organizationRole === "facility_admin" && !access.isOwner ? (
                <a
                  className="inline-flex min-h-12 items-center rounded-lg border border-sea bg-mint px-5 py-3 font-bold text-sea transition hover:bg-[#dff3ed]"
                  href={FACILITY_ACCOUNT_URL}
                >
                  Manage Billing &amp; Seats
                </a>
              ) : null}
              <Link
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/psychosocial-intake-packet"
              >
                View Product Page
              </Link>
            </div>
            {hasBothWorkflows ? (
              <p className="mt-4 text-sm font-semibold text-[#52645f]">
                The two products currently use separate web domains, so the
                other workflow may ask you to sign in again with the same staff
                account.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-3 lg:px-10">
          <article className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <ClipboardList className="h-7 w-7 text-sea" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold">New workflow each time</h2>
              <p className="mt-3 leading-7 text-[#52645f]">
              Open the intake workflow when your team needs fresh PDF-ready documentation for
              the current client/member session.
            </p>
          </article>
          <article className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <FileText className="h-7 w-7 text-clay" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">PDF export only</h2>
            <p className="mt-3 leading-7 text-[#52645f]">
              Save work by downloading an editable draft PDF, exporting a final
              PDF, or printing according to agency policy.
            </p>
          </article>
          <article className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <ShieldCheck className="h-7 w-7 text-sea" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">No client record database</h2>
            <p className="mt-3 leading-7 text-[#52645f]">
              The online account confirms access only. It is not a place for
              client/member assessment information.
            </p>
          </article>
        </section>
      </main>
  );
}
