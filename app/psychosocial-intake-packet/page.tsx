import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileDown,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserRoundCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "The Psychosocial Intake Packet | Adult Day Intake Pro",
  description:
    "Structured Intake for Clear, Compassionate Clinical Insight. A clinical documentation support product created by Marvin Miles, LSW."
};

const packetSupports = [
  "Presenting concerns",
  "Psychosocial history",
  "Mental health and emotional wellness background",
  "ADLs/IADLs and functional review",
  "Social supports and caregiver supports",
  "Safety/risk screening prompts",
  "Strengths and needs",
  "Care planning and referral considerations",
  "Signature/consent sections already part of the packet"
];

const audience = [
  "Social workers",
  "LSWs/LCSWs",
  "Therapists/counselors",
  "Adult medical day care centers",
  "Adult day care programs",
  "Intake staff",
  "Wellness/support-service professionals"
];

const workflowNotes = [
  {
    icon: ClipboardList,
    title: "Structured intake flow",
    text:
      "Organizes the packet around history gathering, support systems, functioning review, safety prompts, and care planning considerations."
  },
  {
    icon: FileDown,
    title: "Local PDF workflow",
    text:
      "Designed for local completion and PDF export through the existing packet workflow."
  },
  {
    icon: ShieldCheck,
    title: "No server retention",
    text:
      "No information is intentionally stored on a server through this local workflow."
  }
];

export default function PsychosocialIntakePacketPage() {
  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#183c5a]">
      <nav className="border-b border-[#eadad2] bg-[#fffaf6]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold text-[#174f80] transition hover:text-[#0f3558]"
          >
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            Adult Day Intake Pro
          </Link>
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/example">
              Example
            </Link>
            <Link className="text-[#45613a] hover:text-[#2f4528]" href="/guide">
              Guide
            </Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-[#eadad2] bg-[#fff8f2]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <Link
            href="/signup"
            aria-label="View the packet and create an access account"
            className="group relative block overflow-hidden rounded-lg border border-[#eadad2] bg-white shadow-soft focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#2f6798]/35"
          >
            <Image
              src="/assets/professional_springtime_intake_packet_promotion.png"
              alt="Spring wellness promotional banner for The Psychosocial Intake Packet by Marvin Miles, LSW"
              width={1600}
              height={900}
              priority
              className="h-auto w-full transition duration-200 group-hover:brightness-[0.98]"
            />
          </Link>

          <div className="mx-auto mt-8 max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d8c08d] bg-white px-4 py-2 text-sm font-bold text-[#45613a]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Clinical documentation support
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-normal text-[#174f80] sm:text-5xl">
              The Psychosocial Intake Packet
            </h1>
            <p className="mt-4 text-2xl font-semibold leading-8 text-[#45613a]">
              Structured Intake for Clear, Compassionate Clinical Insight
            </p>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#394f61]">
              A professional packet designed to support organized psychosocial
              intake, presenting concerns, history gathering, functioning
              review, support systems, and care planning.
            </p>
            <p className="mt-4 font-bold text-[#c85f75]">
              Created by Marvin Miles, LSW
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#2f6798] px-5 py-3 font-bold text-white shadow-soft transition hover:bg-[#245279]"
              >
                Create Access Account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/example"
                className="inline-flex min-h-12 items-center rounded-lg border border-[#b8c7a7] bg-white px-5 py-3 font-bold text-[#183c5a] transition hover:border-[#45613a]"
              >
                View Example Packet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {workflowNotes.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-lg border border-[#eadad2] bg-white p-5 shadow-sm"
            >
              <Icon className="h-7 w-7 text-[#c85f75]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold text-[#174f80]">{title}</h2>
              <p className="mt-3 leading-7 text-[#435665]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#eadad2] bg-[#f7f3e9]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c85f75]">
              Packet scope
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-[#174f80]">
              What the Packet Supports
            </h2>
            <p className="mt-4 leading-7 text-[#435665]">
              Built for a calm, organized intake workflow in adult day care,
              adult medical day care, social work, intake, counseling, wellness,
              and support-service settings.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {packetSupports.map((item) => (
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

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="rounded-lg border border-[#eadad2] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c85f75]">
            Professional use
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-[#174f80]">
            Who This Is For
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {audience.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[#dfe8d4] bg-[#f7fbf4] px-4 py-3 font-semibold text-[#273d4e]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-[#eadad2] bg-white p-6 shadow-sm">
          <UserRoundCheck className="h-8 w-8 text-[#45613a]" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold text-[#174f80]">
            Created by Marvin Miles, LSW
          </h2>
          <p className="mt-3 font-semibold text-[#45613a]">
            Licensed Social Worker | Clinical Documentation Support
          </p>
          <p className="mt-4 leading-7 text-[#435665]">
            Helping make intake clearer, calmer, and more organized.
          </p>
        </aside>
      </section>

      <section className="border-t border-[#eadad2] bg-[#fffaf6]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="rounded-lg border border-[#eadad2] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#174f80]">
              Professional Disclaimer
            </h2>
            <p className="mt-3 leading-7 text-[#435665]">
              This packet is a documentation support tool. It is not a
              substitute for clinical judgment, legal advice, medical advice,
              therapy, crisis support, or individualized treatment planning.
            </p>
            <p className="mt-3 leading-7 text-[#435665]">
              Designed for local completion and PDF export. No information is
              intentionally stored on a server through this local workflow.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
