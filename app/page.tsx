import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  FileDown,
  HeartHandshake,
  LockKeyhole,
  UserCheck
} from "lucide-react";
import { CREATOR_CREDIT } from "@/lib/placeholders";

const features = [
  "17-section packet coverage plus company setup",
  "White-label company branding",
  "Psychosocial assessment",
  "Home visit evaluation",
  "Digital consents and ROI",
  "Mental status screening score",
  "Local Draft PDF Export",
  "Final PDF export",
  "Print-ready packet",
  "Source-specific branding removed"
];

const packageIncludes = [
  "Standard hosted intake workflow",
  "Buyer account login for protected access",
  "Facility setup fields",
  "Session-based logo upload",
  "Psychosocial assessment sections",
  "Consent and ROI sections",
  "Review before export",
  "Download Editable Draft PDF",
  "Export/print final packet",
  "Wet-signature-ready signature lines",
  "No internal app storage of client/member information"
];

const detailedIncludes = [
  "Buyer account access after Stripe payment",
  "Access to the standard digital psychosocial intake workflow",
  "Facility/company information entry",
  "Session-based company logo upload",
  "Psychosocial assessment sections",
  "Consent and ROI sections",
  "Review page before export/print",
  "Download Editable Draft PDF option",
  "Export Final PDF option",
  "Print-ready packet option",
  "Wet-signature lines for member, responsible party, and staff/witness",
  "Signature reminder language: Signature required after printout. Wet signature must be obtained according to agency policy.",
  "No internal draft saving",
  "No app-based storage of client/member information",
  "No database storage of client/member assessment data",
  "No browser draft persistence",
  "Local export/print workflow only"
];

const notIncluded = [
  "Custom agency deployment",
  "Permanent built-in agency logo or branding",
  "Custom consent rewriting",
  "Custom intake sections",
  "Multiple staff seats unless separately configured",
  "Custom user roles or staff permission levels",
  "Database storage of client/member assessment data",
  "Saved internal drafts",
  "Ongoing technical support",
  "HIPAA compliance certification",
  "Business Associate Agreement review",
  "Hosting guarantee beyond the active hosted version",
  "Long-term maintenance unless separately purchased"
];

const faqs = [
  {
    question: "Does this save client information inside the app?",
    answer:
      "No. The standard version is designed as a no-retention workflow. Information entered into the form remains active during the current session unless the user downloads, exports, or prints the packet."
  },
  {
    question: "Can our agency upload our logo?",
    answer:
      "Yes. The standard version allows session-based logo upload. The logo is used during the active session and may appear in the printed or exported packet when available. It is not permanently stored inside the app."
  },
  {
    question: "Can we save an unfinished intake?",
    answer:
      "Yes, by using Download Editable Draft PDF. The unfinished intake is saved only in the downloaded PDF file. The app itself does not store drafts."
  },
  {
    question: "Can staff sign electronically?",
    answer:
      "The standard workflow is designed for wet signatures after printout. Signature lines are included for member/participant, responsible party/representative, and staff/witness signatures."
  },
  {
    question: "Is this HIPAA-compliant?",
    answer:
      "The tool is designed as a privacy-conscious, no-retention workflow, but it should not be described as HIPAA-compliant unless the purchasing agency completes its own HIPAA, security, hosting, policy, and Business Associate Agreement review."
  },
  {
    question: "Is this lifetime access?",
    answer:
      "Standard Agency Access provides access to the hosted standard version while the hosted site remains active. Long-term hosting guarantees, custom deployment, updates, and support require a separate written agreement."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfcfb] text-ink">
      <section className="border-b border-[#d7dfdc] bg-linen">
        <div className="mx-auto grid min-h-[86vh] max-w-7xl content-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:px-10">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sea/20 bg-white px-3 py-1 text-sm font-semibold text-sea">
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              Adult Day Intake Pro
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-normal text-ink sm:text-5xl lg:text-6xl">
              Digital Intake Packets for Adult Day and Adult Medical Day Care
              Programs
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#40524e]">
              A white-label onboarding workflow for psychosocial assessment,
              consents, ROI, home visit review, discharge planning, and
              participant signatures.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#40524e]">
              <UserCheck className="h-4 w-4 text-sea" aria-hidden="true" />
              {CREATOR_CREDIT}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#0b615b]"
              >
                Create Account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/psychosocial-intake-packet"
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
              >
                Psychosocial Intake Packet
              </Link>
              <a
                href="#pricing"
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
              >
                View options
              </a>
              <Link
                href="/example"
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
              >
                View Example
              </Link>
              <Link
                href="/guide"
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
              >
                Read Guide
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#d7dfdc] bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between border-b border-[#e4ebe8] pb-4">
              <div>
                <p className="text-sm font-bold text-sea">Packet workspace</p>
                <p className="text-xs text-[#667873]">No-retention session</p>
              </div>
              <div className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-sea">
                18 steps
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ["Company Setup", "Branding, contacts, footer"],
                ["Intake Assessment", "Function, supports, history"],
                ["Consents", "Release, surveillance, trips, ROI"],
                ["Review & Export", "Print, draft PDF, final PDF"]
              ].map(([title, detail], index) => (
                <div
                  key={title}
                  className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sea text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{title}</p>
                    <p className="text-sm text-[#60726e]">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-[#40524e]">
              <div className="rounded-lg bg-mint p-3">
                <ClipboardList className="mx-auto mb-1 h-4 w-4 text-sea" />
                Forms
              </div>
              <div className="rounded-lg bg-[#fff1ea] p-3">
                <LockKeyhole className="mx-auto mb-1 h-4 w-4 text-clay" />
                No-retention
              </div>
              <div className="rounded-lg bg-[#edf4f3] p-3">
                <FileDown className="mx-auto mb-1 h-4 w-4 text-sea" />
                Export
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-clay">
              Built for intake teams
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal">
              The packet work lives in one guided workflow.
            </h2>
            <p className="mt-4 leading-7 text-[#52645f]">
              Intake coordinators can set facility details, complete the
              assessment, capture typed signatures, review responses, and export
              a packet without sending participant information to outside
              services.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-[#d7dfdc] bg-white px-4 py-3"
              >
                <BadgeCheck className="h-5 w-5 shrink-0 text-sea" />
                <span className="font-semibold text-[#334642]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[#d7dfdc] bg-cloud">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sea">
                Standard Agency Access
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal">
                Digitize your psychosocial intake workflow without storing
                client information inside the app.
              </h2>
              <p className="mt-4 max-w-3xl leading-7 text-[#52645f]">
                Standard Agency Access provides one agency/location with access
                to the standard hosted version of the digital psychosocial
                intake workflow for Adult Medical Day Care, Adult Day Health,
                social workers, interdisciplinary team members, intake
                coordinators, and behavioral health documentation teams.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-5 py-3 font-bold text-ink transition hover:border-sea"
            >
              Open buyer dashboard
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-lg border border-sea bg-white p-6 shadow-soft">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-clay">
                Package
              </p>
              <h3 className="mt-3 text-2xl font-bold">
                Standard Agency Access
              </h3>
              <p className="mt-3 text-4xl font-bold text-sea">
                $497 <span className="text-xl text-[#52645f]">One-Time</span>
              </p>
              <p className="mt-4 leading-7 text-[#52645f]">
                A digital psychosocial intake workflow for Adult Medical Day
                Care and Adult Day Health documentation teams.
              </p>
              <div className="mt-5 grid gap-2">
                {packageIncludes.map((item) => (
                  <div key={item} className="flex gap-2 text-sm font-semibold">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sea" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-[#f0d3c8] bg-[#fff8f5] p-4">
                <p className="font-bold text-clay">Access Notice</p>
                <p className="mt-2 text-sm leading-6 text-[#643524]">
                  Standard Agency Access is provided through the hosted standard
                  version of the tool. Continued access depends on the active
                  availability of the hosted site. Custom deployment, permanent
                  branding, user logins, technical support, maintenance, and
                  compliance review are not included unless purchased separately.
                </p>
              </div>
              <div className="mt-4 rounded-lg border border-[#cde7df] bg-mint p-4">
                <p className="font-bold text-sea">Privacy Notice</p>
                <p className="mt-2 text-sm leading-6 text-[#334642]">
                  This tool is designed as a no-retention, local PDF export-only
                  workflow. Agencies are responsible for storing downloaded or
                  printed packets according to their own privacy, HIPAA, and
                  recordkeeping policies.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-lg border border-[#d7dfdc] bg-white p-6">
                <h3 className="text-xl font-bold">Checkout</h3>
                <p className="mt-3 leading-7 text-[#52645f]">
                  Standard Agency Access - Digital Psychosocial Intake Workflow.
                  Create an agency access account, complete the $497 Stripe
                  checkout, and return to the dashboard to open the packet
                  workflow. Includes session-based facility setup, logo upload,
                  review page, editable draft PDF download, final PDF/print
                  workflow, consent and ROI sections, and wet-signature-ready
                  packet output.
                </p>
                <p className="mt-3 leading-7 text-[#52645f]">
                  This is a no-retention local export workflow. The app does not
                  save client/member information internally. Supabase stores
                  buyer login and access status only. Continued access depends
                  on active availability of the hosted site. Custom setup,
                  dedicated deployment, support, and compliance review are not
                  included.
                </p>
                <Link
                  href="/signup"
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sea px-5 py-3 font-bold text-white transition hover:bg-[#0b615b]"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Create Account and Purchase - $497
                </Link>
              </div>

              <div className="rounded-lg border border-[#d7dfdc] bg-white p-6">
                <h3 className="text-xl font-bold">Hosted Access Language</h3>
                <p className="mt-3 leading-7 text-[#52645f]">
                  Standard Agency Access is provided as access to the hosted
                  standard version of the digital intake workflow. Continued
                  access depends on the active availability of the hosted site.
                  Hosting, updates, technical support, customization, and
                  long-term maintenance are not included unless provided under a
                  separate written agreement.
                </p>
                <p className="mt-3 leading-7 text-[#52645f]">
                  This one-time package gives your agency access to the standard
                  hosted version of the intake tool. The tool remains available
                  while the hosted version is active. Agencies that want their
                  own dedicated deployment, custom form language, permanent
                  branding, staff logins, or long-term independent control may
                  request a separate Agency-Owned Setup package.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#d7dfdc] bg-white p-6">
            <h3 className="text-xl font-bold">Privacy and Signature Notes</h3>
            <p className="mt-3 leading-7 text-[#52645f]">
              This tool is designed as a no-retention, local PDF export-only
              workflow. Assessment information entered into the app remains
              active only during the current browser session unless the user
              downloads or prints the packet. The app does not intentionally save
              completed intakes, drafts, client/member information, or uploaded
              logos inside the application.
            </p>
            <p className="mt-3 leading-7 text-[#52645f]">
              This tool is designed to support privacy-conscious documentation
              workflows; however, it should not be described as HIPAA-compliant
              unless the purchasing agency completes its own HIPAA, security,
              hosting, policy, and Business Associate Agreement review. Each
              agency is responsible for using approved devices, secure storage
              locations, staff procedures, and internal privacy policies when
              handling client/member information.
            </p>
            <p className="mt-3 font-bold leading-7 text-ink">
              Completed packets are designed for printout and wet signature.
              Signature required after printout. Wet signature must be obtained
              according to agency policy.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-lg border border-[#d7dfdc] bg-white p-6">
              <h3 className="text-xl font-bold">
                What&apos;s Included - $497 one-time
              </h3>
              <div className="mt-4 grid gap-2">
                {detailedIncludes.map((item) => (
                  <div key={item} className="flex gap-2 text-sm font-semibold">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sea" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d7dfdc] bg-white p-6">
              <h3 className="text-xl font-bold">What Is Not Included</h3>
              <p className="mt-3 leading-7 text-[#52645f]">
                The $497 Standard Agency Access package does not include:
              </p>
              <div className="mt-4 grid gap-2">
                {notIncluded.map((item) => (
                  <div key={item} className="flex gap-2 text-sm font-semibold">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-clay" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-5 rounded-lg border border-[#d7dfdc] bg-white p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sea">
              FAQ
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              Common questions before purchase
            </h3>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-4"
                >
                  <h4 className="font-bold text-ink">{faq.question}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#52645f]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
          </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-[#52645f] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <p className="font-bold">{CREATOR_CREDIT}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/guide">
            Guide
          </Link>
          <Link
            className="font-bold text-sea hover:text-[#0b615b]"
            href="/psychosocial-intake-packet"
          >
            Psychosocial Intake Packet
          </Link>
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/example">
            Fictitious example
          </Link>
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/intake">
            Open intake
          </Link>
        </div>
      </footer>
    </main>
  );
}
