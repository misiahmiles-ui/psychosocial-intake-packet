"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ClipboardList,
  Eye,
  FileText,
  ShieldCheck
} from "lucide-react";
import { OwnerAccess, type OwnerStatusData } from "@/components/auth/OwnerAccess";
import { OwnerExportTestPanel } from "./OwnerExportTestPanel";
import { INTAKE_STEPS } from "@/lib/sections";

export function OwnerControlCenter() {
  return (
    <OwnerAccess>
      {(data) => <OwnerControlCenterContent data={data} />}
    </OwnerAccess>
  );
}

function OwnerControlCenterContent({ data }: { data: OwnerStatusData }) {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-[#d7dfdc] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#cde7df] bg-mint px-4 py-2 text-sm font-bold text-sea">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Product Owner Access &mdash; No Subscription Required
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-normal text-ink">
            Owner Control Center
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-[#52645f]">
            Review the complete live workflow, inspect every section, test PDF
            exports, and preview the customer experience without creating a
            Stripe payment or storing clinical information.
          </p>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
        <div className="grid gap-5 lg:self-start">
          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold tracking-normal text-ink">
              Workflow Access
            </h2>
            <div className="mt-4 grid gap-3">
              <OwnerActionLink
                href="/owner/intake?mode=review"
                icon={ClipboardList}
                title="Open Full Psychosocial Intake Workflow"
                text="Open the blank interactive workflow with owner review navigation."
              />
              <OwnerActionLink
                href="/owner/intake?mode=buyer"
                icon={Eye}
                title="Preview Buyer Experience"
                text="See the protected workflow as a purchaser would, with owner access bypassing Stripe only for this account."
              />
              <OwnerActionLink
                href="/owner/intake?mode=review&demo=1"
                icon={FileText}
                title="Load Fictitious Demonstration Case"
                text="Load fictional, non-PHI sample data to test review, export, and print output."
              />
            </div>
          </section>

          <OwnerExportTestPanel />

          <ProductInfo data={data} />
        </div>

        <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-normal text-ink">
                Workflow Section Index
              </h2>
              <p className="mt-2 max-w-2xl leading-7 text-[#52645f]">
                Select any section to inspect it directly in Owner Review Mode.
              </p>
            </div>
            <Link
              href="/owner/intake?mode=review"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b615b]"
            >
              Start Review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {INTAKE_STEPS.map((step, index) => {
              const fields = [
                ...(step.fields ?? []),
                ...(step.groups?.flatMap((group) => group.fields) ?? [])
              ];
              const requiredCount = fields.filter((field) => field.required).length;

              return (
                <Link
                  key={step.id}
                  href={`/owner/intake?mode=review&step=${index}`}
                  className="grid gap-3 rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-4 transition hover:border-sea sm:grid-cols-[2.25rem_1fr]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-sm font-bold text-sea">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-bold text-ink">{step.title}</span>
                    <span className="mt-2 grid gap-2 text-sm text-[#52645f] sm:grid-cols-3">
                      <span>Review status: Ready to inspect</span>
                      <span>
                        Required fields: {requiredCount ? requiredCount : "None marked"}
                      </span>
                      <span>Final export: Included</span>
                    </span>
                  </span>
                </Link>
              );
            })}
            <Link
              href={`/owner/intake?mode=review&step=${INTAKE_STEPS.length}`}
              className="rounded-lg border border-[#f0d3c8] bg-[#fff8f5] p-4 font-bold text-clay transition hover:border-clay"
            >
              Review & Export screen
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function OwnerActionLink({
  href,
  icon: Icon,
  text,
  title
}: {
  href: string;
  icon: LucideIcon;
  text: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-lg border border-[#d7dfdc] bg-[#fbfcfb] p-4 transition hover:border-sea"
    >
      <Icon className="mt-1 h-5 w-5 shrink-0 text-sea" aria-hidden="true" />
      <span>
        <span className="block font-bold text-ink">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[#52645f]">
          {text}
        </span>
      </span>
    </Link>
  );
}

function ProductInfo({ data }: { data: OwnerStatusData }) {
  const rows = [
    ["Application/product", data.product.name],
    ["Version", data.product.version],
    ["Environment", data.deployment.environment],
    ["Build/deployment", data.deployment.commit ?? "Not available"],
    ["Owner account", data.owner.email ?? "Signed in owner"]
  ];

  return (
    <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold tracking-normal text-ink">
        Product Information
      </h2>
      <dl className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-[#fbfcfb] p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#667873]">
              {label}
            </dt>
            <dd className="mt-1 break-words font-semibold text-[#334642]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/psychosocial-intake-packet"
          className="inline-flex min-h-10 items-center rounded-lg border border-[#b9c7c3] bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sea"
        >
          Open public product page
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center rounded-lg border border-[#b9c7c3] bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sea"
        >
          Open normal dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-10 items-center rounded-lg border border-[#b9c7c3] bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-sea"
        >
          Open normal login
        </Link>
      </div>
    </section>
  );
}
