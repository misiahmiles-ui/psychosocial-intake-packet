import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileDown, ShieldCheck } from "lucide-react";
import {
  CREATOR_CREDIT,
  EXPORT_PRIVACY_NOTICE,
  PRODUCT_NAME
} from "@/lib/placeholders";

const included = [
  "18-step intake workflow covering company setup plus the full packet structure",
  "No-retention active browser session workflow",
  "Download Editable Draft PDF",
  "Export Final PDF",
  "Print and Clear Form controls",
  "Mental status screening with automatic score and interpretation",
  "Fictitious completed example packet",
  "White-label company placeholders for headers, consent language, and exports"
];

const nextSteps = [
  "Create your sales page copy and screenshots from the landing page, intake workflow, and example packet.",
  "Create Supabase Auth and profiles access for buyer accounts only.",
  "Create Stripe checkout and connect the payment webhook to unlock paid access.",
  "Deploy the app to Netlify using the standard Next.js build command: pnpm build.",
  "Keep payment processing and buyer login separate from participant data entry.",
  "Prepare a buyer onboarding checklist that explains local PDF export only, approved storage expectations, and Adobe Acrobat Reader recommendation.",
  "For agencies that will use real participant information, complete a separate hosting, privacy, security, HIPAA, BAA, and agency policy review before claiming compliance."
];

const standardAgencyIncludes = [
  "Buyer account login for protected hosted access",
  "Access to the standard digital psychosocial intake workflow",
  "Facility/company information entry",
  "Session-based company logo upload",
  "Psychosocial assessment, consent, and ROI sections",
  "Review page before export/print",
  "Download Editable Draft PDF option",
  "Export Final PDF option",
  "Print-ready packet option",
  "Wet-signature lines and signature-after-printout reminder language",
  "No internal draft saving, client/member database storage, or browser draft persistence"
];

const standardAgencyNotIncluded = [
  "Custom agency deployment",
  "Permanent built-in agency logo or branding",
  "Custom consent rewriting or custom intake sections",
  "Multiple staff seats unless separately configured",
  "Client/member database storage or saved internal drafts",
  "Ongoing technical support",
  "HIPAA compliance certification or BAA review",
  "Hosting guarantee or long-term maintenance unless separately purchased"
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-[#d7dfdc] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-sea hover:text-[#0b615b]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to product page
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">
            {PRODUCT_NAME} guide
          </h1>
          <p className="mt-2 font-semibold text-[#52645f]">{CREATOR_CREDIT}</p>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-10">
        <aside className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm lg:self-start">
          <ShieldCheck className="h-7 w-7 text-sea" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold">Privacy and storage</h2>
          <p className="mt-3 leading-7 text-[#52645f]">
            {EXPORT_PRIVACY_NOTICE}
          </p>
          <p className="mt-3 leading-7 text-[#52645f]">
            This is a privacy-conscious/no-retention workflow design, not a
            HIPAA compliance certification.
          </p>
        </aside>

        <div className="grid gap-5">
          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">What is included</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sea" />
                  <p className="text-sm font-semibold text-[#334642]">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Editable Draft PDF behavior</h2>
            <p className="mt-3 leading-7 text-[#52645f]">
              The app uses local PDF export only and does not save drafts
              internally. Editable Draft PDF behavior may vary by PDF viewer.
              Adobe Acrobat Reader is recommended for completing or revising
              downloaded editable draft PDFs. Checkbox, multiple-choice, and
              scoring responses include readable selected-answer summaries to
              preserve clarity across PDF viewers.
            </p>
          </section>

          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sea">
              Sales package
            </p>
            <h2 className="mt-3 text-xl font-bold">
              Standard Agency Access - $497 One-Time
            </h2>
            <p className="mt-3 leading-7 text-[#52645f]">
              Standard Agency Access provides one agency/location with access to
              the standard hosted version of the digital psychosocial intake
              workflow. Continued access depends on the active availability of
              the hosted site. Hosting, updates, technical support,
              customization, and long-term maintenance are not included unless
              provided under a separate written agreement.
            </p>
            <p className="mt-3 leading-7 text-[#52645f]">
              This tool is designed as a no-retention, local PDF export-only
              workflow. Assessment information remains active only during the
              current browser session unless the user downloads or prints the
              packet. The app does not intentionally save completed intakes,
              drafts, client/member information, or uploaded logos inside the
              application.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-4">
                <h3 className="font-bold text-ink">Includes</h3>
                <ul className="mt-3 grid gap-2 text-sm font-semibold text-[#334642]">
                  {standardAgencyIncludes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sea" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-4">
                <h3 className="font-bold text-ink">Not included</h3>
                <ul className="mt-3 grid gap-2 text-sm font-semibold text-[#334642]">
                  {standardAgencyNotIncluded.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-clay" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-[#f0d3c8] bg-[#fff8f5] p-4 text-sm font-semibold leading-6 text-[#643524]">
              This tool should not be described as HIPAA-compliant unless the
              purchasing agency completes its own HIPAA, security, hosting,
              policy, and Business Associate Agreement review.
            </p>
            <p className="mt-3 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
              Access setup note: Supabase stores buyer login and access status
              only. Stripe handles payment. The intake packet workflow does not
              save client/member responses to Supabase, Netlify, or a database.
            </p>
          </section>

          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Next steps to sell it</h2>
            <ol className="mt-4 grid gap-3">
              {nextSteps.map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[2rem_1fr] gap-3 rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sea text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="leading-7 text-[#40524e]">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Useful links</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/intake"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b615b]"
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Open intake
              </Link>
              <Link
                href="/example"
                className="inline-flex min-h-11 items-center rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea"
              >
                View fictitious example
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
