import Link from "next/link";
import { ArrowLeft, BadgeCheck, FileText } from "lucide-react";
import { ExamplePacketActions } from "@/components/ExamplePacketActions";
import { ReviewPacket } from "@/components/ReviewPacket";
import { CREATOR_CREDIT, PRODUCT_NAME } from "@/lib/placeholders";
import { examplePacket } from "@/lib/examplePacket";

export default function ExamplePage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-[#d7dfdc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-sea hover:text-[#0b615b]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to product page
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-normal">
              Fictitious completed packet example
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#52645f]">
              {PRODUCT_NAME} | {CREATOR_CREDIT}
            </p>
          </div>
          <ExamplePacketActions />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="mb-5 rounded-lg border border-[#cde7df] bg-mint p-4">
          <p className="flex items-start gap-2 font-bold text-sea">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            This is a training/sample packet only.
          </p>
          <p className="mt-2 leading-7 text-[#334642]">
            The participant, provider, company, phone numbers, email addresses,
            and addresses are fictitious. Use this example to understand the
            kind of information that belongs in each section before completing a
            real intake.
          </p>
        </div>

        <div className="mb-5 rounded-lg border border-[#d7dfdc] bg-white p-4">
          <p className="flex items-center gap-2 font-bold text-ink">
            <FileText className="h-5 w-5 text-sea" aria-hidden="true" />
            Example PDF downloads
          </p>
          <p className="mt-2 leading-7 text-[#52645f]">
            Download the example draft PDF to see editable fields, checkbox and
            radio controls, selected-answer summaries, and scoring output.
            Download the final PDF to see a completed packet-style export.
          </p>
        </div>

        <ReviewPacket packet={examplePacket} />
      </section>
    </main>
  );
}
