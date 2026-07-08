"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import { ProtectedAccess } from "@/components/auth/ProtectedAccess";

export function DashboardClient() {
  return (
    <ProtectedAccess>
      <main className="min-h-screen bg-cloud text-ink">
        <section className="border-b border-[#d7dfdc] bg-linen">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sea">
              Standard Agency Access
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal">
              Adult Day Intake Pro™ Dashboard
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[#52645f]">
              Start a new workflow, review the guide, or open the fictitious
              example. The documentation workflow does not save client/member
              assessment data to Supabase or Netlify.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b]"
                href="/intake"
              >
                Start New Intake Workflow
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/guide"
              >
                Open Guide
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/example/full"
              >
                View Full Example
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/presentation"
              >
                View Presentation
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
                href="/psychosocial-intake-packet"
              >
                View Product Page
              </Link>
            </div>
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
    </ProtectedAccess>
  );
}
