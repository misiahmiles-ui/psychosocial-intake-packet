"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Pause,
  Play,
  ShieldCheck
} from "lucide-react";

type Slide = {
  eyebrow: string;
  image: string;
  title: string;
  body: string;
  bullets?: string[];
  note?: string;
};

const slides: Slide[] = [
  {
    eyebrow: "Adult Day Intake Pro™",
    image: "/assets/professional_springtime_intake_packet_promotion.png",
    title: "Psychosocial Intake & PDF Documentation Workflow",
    body:
      "A hosted digital workflow for adult day care and adult medical daycare programs that need organized psychosocial intake, consent, safety review, and PDF-ready documentation."
  },
  {
    eyebrow: "Built for",
    image: "/assets/tree-and-path.jpeg",
    title: "Adult Day Care and Adult Medical Daycare Programs",
    body:
      "The workflow is designed for teams that need a structured way to organize intake information before exporting a local PDF record.",
    bullets: [
      "Social workers and intake staff",
      "Interdisciplinary team members",
      "Adult day care and adult medical daycare programs",
      "Documentation support workflows"
    ]
  },
  {
    eyebrow: "Included",
    image: "/assets/tree-2.jpeg",
    title: "Facility Setup Fields",
    body:
      "The workflow starts with agency/facility setup so packet output can reflect the program completing the intake.",
    bullets: [
      "Facility name and contact information",
      "Administrator/contact information",
      "Session-based logo upload",
      "Footer and provider details for PDF output"
    ]
  },
  {
    eyebrow: "Included",
    image: "/assets/tree.jpeg",
    title: "Psychosocial Intake Sections",
    body:
      "The intake workflow helps staff organize psychosocial history, presenting concerns, caregiver supports, strengths, needs, and care planning notes.",
    bullets: [
      "Presenting concerns",
      "Psychosocial history",
      "Mood, stressors, coping, and social engagement",
      "Strengths, needs, and referral considerations"
    ]
  },
  {
    eyebrow: "Included",
    image: "/assets/tree-and-path.jpeg",
    title: "Function, Supports, and Safety Review",
    body:
      "The workflow includes structured areas for functional status, living supports, caregiver supports, and safety considerations.",
    bullets: [
      "ADLs/IADLs and mobility notes",
      "Living situation and caregiver supports",
      "Assistive devices and safety precautions",
      "Risk, elopement, and protection prompts"
    ]
  },
  {
    eyebrow: "Included",
    image: "/assets/tree-2.jpeg",
    title: "Consent and ROI Sections",
    body:
      "Standard Agency Access includes structured consent and release-of-information sections for wet-signature-ready PDF packet output.",
    bullets: [
      "Consent and acknowledgement sections",
      "Release-of-information documentation",
      "Transportation and program permissions",
      "Signature lines for printout"
    ]
  },
  {
    eyebrow: "Included",
    image: "/assets/tree.jpeg",
    title: "Review Before Export",
    body:
      "Before exporting, staff can review the entered information on screen to catch missing or incomplete responses.",
    bullets: [
      "Review page before download/print",
      "Readable selected-answer summaries",
      "Scoring summaries where applicable",
      "Clear final PDF packet output"
    ]
  },
  {
    eyebrow: "Included",
    image: "/assets/tree-and-path.jpeg",
    title: "Editable Draft PDF, Final PDF, and Print",
    body:
      "The workflow supports local PDF handling instead of internal saved drafts.",
    bullets: [
      "Editable draft PDF download",
      "Final PDF export",
      "Print/save-as-PDF workflow",
      "Wet-signature-ready packet output"
    ]
  },
  {
    eyebrow: "Privacy",
    image: "/assets/tree-2.jpeg",
    title: "No Internal App Storage of Client Information",
    body:
      "The app is designed for local completion and PDF export. It does not store client/member assessment responses inside the app.",
    note:
      "Buyer login and access status are handled separately from client/member workflow responses."
  },
  {
    eyebrow: "Access",
    image: "/assets/tree.jpeg",
    title: "Standard Agency Access",
    body:
      "$487 upfront access fee + $19/month hosted access and maintenance.",
    bullets: [
      "One adult day care or adult medical daycare program",
      "Hosted standard workflow access",
      "Continued access depends on active monthly subscription",
      "Standard maintenance for the hosted version"
    ]
  },
  {
    eyebrow: "Not included",
    image: "/assets/tree-and-path.jpeg",
    title: "No Custom Agency Deployment",
    body:
      "What it means: buyers use the standard hosted version. What it does: keeps setup simple and separates custom deployments into a separate written agreement."
  },
  {
    eyebrow: "Not included",
    image: "/assets/tree-2.jpeg",
    title: "No Permanent Custom Branding",
    body:
      "What it means: facility details and session-based logo upload are available, but the app is not permanently rebuilt around each buyer's brand. What it does: keeps the standard workflow consistent."
  },
  {
    eyebrow: "Not included",
    image: "/assets/tree.jpeg",
    title: "No Custom Consent Rewriting or Custom Intake Sections",
    body:
      "What it means: Standard Agency Access includes the standard sections. What it does: agencies that need custom consent language or new sections should handle that as a separate custom project and review it under their own policies."
  },
  {
    eyebrow: "Not included",
    image: "/assets/tree-and-path.jpeg",
    title: "No Staff Role System, Saved Drafts, or Client Database",
    body:
      "What it means: this is not a multi-seat staff management platform and does not save client/member drafts internally. What it does: protects the no-retention model and keeps saved work inside downloaded PDFs."
  },
  {
    eyebrow: "Not included",
    image: "/assets/tree-2.jpeg",
    title: "No HIPAA Certification, BAA Review, or Compliance Review",
    body:
      "What it means: the workflow is documentation support, not a compliance package. What it does: each agency remains responsible for privacy, security, HIPAA, BAA, legal, and policy review before using real client/member information."
  },
  {
    eyebrow: "Not included",
    image: "/assets/tree.jpeg",
    title: "No Dedicated Agency-Owned Hosting",
    body:
      "What it means: Standard Agency Access is hosted access to the standard site, not a private copy owned by the agency. What it does: dedicated hosting or long-term custom maintenance would require a separate written agreement."
  },
  {
    eyebrow: "Summary",
    image: "/assets/tree-and-path.jpeg",
    title: "Structured Workflow. Clear Boundaries.",
    body:
      "Adult Day Intake Pro™ provides a hosted psychosocial intake and PDF documentation workflow. It does not replace clinical judgment, legal advice, medical advice, compliance review, agency policy review, or secure document storage practices.",
    bullets: [
      "Use the public preview to see selected sections",
      "Use Standard Agency Access for the full hosted workflow",
      "Use downloaded PDFs for local record handling"
    ]
  }
];

export function WorkflowPresentation() {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const slide = slides[index];
  const progress = useMemo(
    () => Math.round(((index + 1) / slides.length) * 100),
    [index]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  function goPrevious() {
    setIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }

  function goNext() {
    setIndex((current) => (current + 1) % slides.length);
  }

  return (
    <main className="min-h-screen bg-[#fff8f2] text-[#183c5a]">
      <header className="border-b border-[#eadad2] bg-[#fffaf6]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href="/psychosocial-intake-packet"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#174f80] hover:text-[#0f3558]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to product page
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/example"
              className="inline-flex min-h-10 items-center rounded-lg border border-[#b8c7a7] bg-white px-4 py-2 text-sm font-bold text-[#183c5a] transition hover:border-[#45613a]"
            >
              Limited Example
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-10 items-center rounded-lg bg-[#2f6798] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#245279]"
            >
              Get Access
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="relative min-h-[68vh] overflow-hidden rounded-lg border border-[#eadad2] bg-white shadow-soft">
          <Image
            src={slide.image}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#183c5a]/62" />
          <div className="relative grid min-h-[68vh] items-end p-5 sm:p-8 lg:grid-cols-[1fr_0.72fr] lg:gap-8 lg:p-10">
            <article className="max-w-3xl rounded-lg border border-white/20 bg-white/95 p-5 shadow-soft sm:p-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#d8c08d] bg-[#fff8f2] px-4 py-2 text-sm font-bold text-[#45613a]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {slide.eyebrow}
              </p>
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-normal text-[#174f80] sm:text-5xl">
                {slide.title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#394f61]">
                {slide.body}
              </p>
              {slide.bullets ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {slide.bullets.map((bullet) => (
                    <div key={bullet} className="flex gap-2 text-sm font-semibold text-[#273d4e]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#45613a]" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {slide.note ? (
                <p className="mt-5 rounded-lg border border-[#cde7df] bg-[#e7f8f2] p-4 text-sm font-semibold leading-6 text-[#334642]">
                  {slide.note}
                </p>
              ) : null}
            </article>

            <aside className="mt-5 rounded-lg border border-white/25 bg-[#fff8f2]/95 p-5 lg:mt-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c85f75]">
                Presentation
              </p>
              <p className="mt-2 text-3xl font-bold text-[#174f80]">
                {index + 1} / {slides.length}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadad2]">
                <div
                  className="h-full rounded-full bg-[#45613a] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goPrevious}
                  className="inline-flex min-h-11 items-center rounded-lg border border-[#b8c7a7] bg-white px-4 py-2 text-sm font-bold text-[#183c5a] transition hover:border-[#45613a]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((current) => !current)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b8c7a7] bg-white px-4 py-2 text-sm font-bold text-[#183c5a] transition hover:border-[#45613a]"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2f6798] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#245279]"
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
