"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, ShieldCheck } from "lucide-react";
import { CREATOR_CREDIT, PRIVACY_NOTICE, PRODUCT_NAME } from "@/lib/placeholders";

export function ReviewWorkspace() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-[#d7dfdc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 text-sm font-bold text-sea hover:text-[#0b615b]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to active intake
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-normal">
              {PRODUCT_NAME} packet review
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#52645f]">
              {CREATOR_CREDIT}
            </p>
          </div>
          <div className="rounded-lg border border-[#cde7df] bg-mint px-4 py-3 text-sm font-semibold text-[#334642]">
            <ShieldCheck className="mr-2 inline h-4 w-4 text-sea" />
            {PRIVACY_NOTICE}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <div className="rounded-lg border border-[#d7dfdc] bg-white p-6 shadow-sm">
          <FileDown className="h-8 w-8 text-sea" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold tracking-normal">
            Review happens inside the active intake session.
          </h2>
          <p className="mt-3 leading-7 text-[#52645f]">
            This app does not store drafts or reload assessment information from
            browser storage. To review entered information, keep the intake tab
            open and use the Review & Export step before downloading an
            Editable Draft PDF or exporting a final PDF.
          </p>
          <Link
            href="/intake"
            className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-sea px-5 py-3 font-bold text-white transition hover:bg-[#0b615b]"
          >
            Open intake workflow
          </Link>
        </div>
      </section>
    </main>
  );
}
