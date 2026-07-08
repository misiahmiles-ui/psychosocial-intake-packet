import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRoundCheck
} from "lucide-react";

const includes = [
  "Facility setup fields",
  "Psychosocial assessment sections",
  "Consent and ROI sections",
  "Safety review prompts",
  "Review-before-export workspace",
  "Editable draft PDF download",
  "Final PDF and print export",
  "Wet-signature-ready packet output"
];

const supports = [
  "Presenting concerns",
  "Psychosocial history",
  "Functional status and ADLs/IADLs",
  "Caregiver and social supports",
  "Safety considerations",
  "Strengths and needs",
  "Release-of-information documentation",
  "Care planning and referral considerations"
];

const notIncluded = [
  "Custom agency deployment",
  "Permanent custom branding",
  "Custom consent rewriting",
  "Custom intake sections",
  "Multiple staff seats unless separately configured",
  "Custom user roles",
  "Saved drafts",
  "HIPAA certification",
  "BAA review",
  "Compliance review",
  "Dedicated agency-owned hosting unless separately agreed in writing"
];

const workflowCards = [
  {
    icon: ClipboardList,
    title: "Structured Intake",
    text:
      "Guides staff through psychosocial history, presenting concerns, functional review, caregiver supports, safety prompts, and consent sections."
  },
  {
    icon: FileDown,
    title: "PDF-Ready Records",
    text:
      "Supports editable draft PDF download, final PDF export, print output, and wet-signature-ready packet output for agency handling."
  },
  {
    icon: ShieldCheck,
    title: "Local Completion",
    text:
      "The workflow is designed for browser-session completion and local PDF export, without internal app storage of client/member responses."
  }
];

export function AdultDayIntakeProMarketing() {
  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#183c5a]">
      <nav className="border-b border-[#eadad2] bg-[#fffaf6]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold text-[#174f80] transition hover:text-[#0f3558]"
          >
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            Adult Day Intake Pro™
          </Link>
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/signup">
              Get Access
            </Link>
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/login">
              Login
            </Link>
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/example">
              Example
            </Link>
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/presentation">
              Presentation
            </Link>
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/guide">
              Guide
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-[#eadad2]">
        <Image
          src="/assets/tree.jpeg"
          alt="Spring park scene with blue sky, green grass, and flowering trees"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#183c5a]/55" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl items-center px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-4xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Psychosocial Intake & PDF Documentation Workflow
            </p>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-normal sm:text-6xl lg:text-7xl">
              Adult Day Intake Pro™
            </h1>
            <p className="mt-5 text-2xl font-semibold leading-9 text-[#f7f3e9]">
              Psychosocial Intake & PDF Documentation Workflow
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#fffaf6]">
              Built for adult day care and adult medical daycare programs that
              need a structured intake, consent, psychosocial assessment, safety
              review, and PDF-ready documentation process.
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-[#f7f3e9]">
              A structured digital intake workflow for adult day care and adult
              medical daycare programs. Designed to help staff organize
              psychosocial history, presenting concerns, functional status,
              caregiver supports, safety considerations, consent sections,
              release-of-information documentation, and PDF-ready intake
              records.
            </p>
            <p className="mt-5 font-bold text-[#ffe4eb]">
              Created by Marvin Miles, LSW.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f6798] px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#245279]"
              >
                Get Standard Agency Access
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center rounded-lg border border-white/55 bg-white px-5 py-3 font-bold text-[#183c5a] transition hover:bg-[#fff8f2]"
              >
                Access the Hosted Workflow
              </Link>
              <Link
                href="/presentation"
                className="inline-flex min-h-12 items-center rounded-lg border border-white/55 bg-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/25"
              >
                View Presentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#eadad2] bg-[#fffaf6]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:px-8 lg:grid-cols-3 lg:px-10">
          {workflowCards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-[#eadad2] bg-white p-5 shadow-sm">
              <Icon className="h-7 w-7 text-[#c85f75]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-[#174f80]">{title}</h2>
              <p className="mt-3 leading-7 text-[#435665]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c85f75]">
              Built for Adult Day Care and Adult Medical Daycare Programs
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-[#174f80]">
              Structured Intake. Clear Documentation. PDF-Ready Records.
            </h2>
            <p className="mt-4 leading-7 text-[#435665]">
              Adult Day Intake Pro™ supports a calm, organized intake workflow
              for adult day care, adult medical daycare, social work, intake,
              wellness, and support-service settings.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {supports.map((item) => (
              <div
                key={item}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-[#eadad2] bg-white px-4 py-3"
              >
                <BadgeCheck className="h-5 w-5 shrink-0 text-[#45613a]" />
                <span className="font-semibold text-[#273d4e]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="standard-agency-access" className="border-y border-[#eadad2] bg-[#f7f3e9]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#45613a]">
                What Standard Agency Access Includes
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-[#174f80]">
                $487 upfront access fee + $19/month hosted access and maintenance
              </h2>
              <p className="mt-4 leading-7 text-[#435665]">
                Standard Agency Access gives one adult day care or adult medical
                daycare program access to the hosted digital psychosocial intake
                workflow.
              </p>
              <p className="mt-4 leading-7 text-[#435665]">
                The $487 upfront access fee activates the agency's access to the
                standard hosted workflow. The $19/month subscription covers
                continued hosted access and standard maintenance for the hosted
                version. Continued hosted access depends on an active monthly
                subscription and the active availability of the hosted site.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f6798] px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#245279]"
              >
                Purchase Standard Agency Access
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {includes.map((item) => (
                <div key={item} className="rounded-lg border border-[#eadad2] bg-white p-4">
                  <ClipboardCheck className="h-5 w-5 text-[#c85f75]" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-[#273d4e]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">
        <article className="rounded-lg border border-[#cde7df] bg-[#e7f8f2] p-6">
          <ShieldCheck className="h-8 w-8 text-[#0f766e]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold text-[#174f80]">
            No Internal App Storage of Client Information
          </h2>
          <p className="mt-4 leading-7 text-[#334642]">
            The workflow is designed for local completion and PDF export. The
            app itself is not intended to internally retain client/member
            information, completed intakes, draft packets, or uploaded logos.
            Buyer login and access status are handled separately from client
            documentation.
          </p>
          <p className="mt-4 leading-7 text-[#334642]">
            Agencies are responsible for storing downloaded PDFs and printed
            packet output according to their own privacy, security, HIPAA,
            recordkeeping, and agency policy requirements.
          </p>
        </article>

        <article className="rounded-lg border border-[#eadad2] bg-white p-6 shadow-sm">
          <LockKeyhole className="h-8 w-8 text-[#c85f75]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold text-[#174f80]">
            Hosted Access & Maintenance
          </h2>
          <p className="mt-4 leading-7 text-[#435665]">
            The monthly subscription covers continued hosted access and standard
            maintenance for the hosted version. Standard Agency Access does not
            include custom deployment, compliance review, or agency-owned
            hosting unless separately agreed in writing.
          </p>
        </article>
      </section>

      <section className="border-y border-[#eadad2] bg-[#fffaf6]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c85f75]">
              What Is Not Included
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-[#174f80]">
              Clear access limits before purchase
            </h2>
            <p className="mt-4 leading-7 text-[#435665]">
              Standard Agency Access is the hosted standard workflow. It does
              not replace legal review, compliance review, clinical judgment, or
              agency policy review.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {notIncluded.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-[#eadad2] bg-white p-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c85f75]" />
                <span className="font-semibold text-[#273d4e]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fff8f2]">
        <Image
          src="/assets/tree-and-path.jpeg"
          alt="Open park pathway with green grass and blue sky"
          fill
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <UserRoundCheck className="h-8 w-8 text-[#45613a]" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-bold tracking-normal text-[#174f80]">
              Created by Marvin Miles, LSW
            </h2>
            <p className="mt-3 font-semibold text-[#45613a]">
              Licensed Social Worker | Clinical Documentation Support
            </p>
            <p className="mt-4 leading-7 text-[#435665]">
              Helping make intake clearer, calmer, and more organized.
            </p>
            <p className="mt-6 rounded-lg border border-[#eadad2] bg-white p-4 leading-7 text-[#435665]">
              This workflow is a documentation support tool. It is not a
              substitute for clinical judgment, legal advice, medical advice,
              therapy, crisis support, individualized treatment planning,
              compliance review, or agency policy review.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
