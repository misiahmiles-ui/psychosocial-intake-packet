import type { Metadata } from "next";
import Link from "next/link";
import { LegalAcceptanceForm } from "@/components/legal/LegalAcceptanceForm";

export const metadata: Metadata = {
  title: "Review Legal Terms | Adult Day Intake Products",
  description: "Review and accept the current product-family legal terms."
};

export default function LegalAcceptancePage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-10 sm:px-8">
        <div className="w-full rounded-xl border border-[#d7dfdc] bg-[#fbfcfb] p-6 shadow-soft sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sea">
            Adult Day Intake product family
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-normal">
            Review and accept before continuing
          </h1>
          <p className="mt-4 leading-7 text-[#52645f]">
            One unified Terms of Service and Privacy Policy applies to the
            Psychosocial Intake, Nursing Intake, Complete Suite, facility
            account, and named staff access.
          </p>
          <LegalAcceptanceForm />
          <p className="mt-5 text-sm font-semibold text-[#52645f]">
            Need to leave without accepting?{" "}
            <Link className="font-bold text-sea hover:text-[#0b615b]" href="/">
              Return to the product page
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
