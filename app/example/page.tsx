import Link from "next/link";
import { ArrowLeft, BadgeCheck, FileText, LockKeyhole } from "lucide-react";
import { ExamplePacketActions } from "@/components/ExamplePacketActions";
import { ReviewPacket } from "@/components/ReviewPacket";
import { CREATOR_CREDIT, PRODUCT_NAME } from "@/lib/placeholders";
import { examplePacket } from "@/lib/examplePacket";
import { LIMITED_EXAMPLE_STEP_IDS } from "@/lib/exampleAccess";

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
              Limited fictitious workflow preview
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#52645f]">
              {PRODUCT_NAME} | {CREATOR_CREDIT}
            </p>
          </div>
          <ExamplePacketActions
            filenamePrefix="adult-day-intake-example-preview"
            stepIds={LIMITED_EXAMPLE_STEP_IDS}
            variant="preview"
          />
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
            and addresses are fictitious. This public preview shows selected
            psychosocial intake workflow sections so prospective buyers can see
            the structure before creating access.
          </p>
        </div>

        <div className="mb-5 rounded-lg border border-[#d7dfdc] bg-white p-4">
          <p className="flex items-center gap-2 font-bold text-ink">
            <FileText className="h-5 w-5 text-sea" aria-hidden="true" />
            Example PDF downloads
          </p>
          <p className="mt-2 leading-7 text-[#52645f]">
            Public downloads are intentionally limited to selected intake
            workflow sections. The full completed example PDF is available
            inside the protected dashboard after Standard Agency Access is
            active.
          </p>
          <Link
            href="/signup"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea"
          >
            <LockKeyhole className="h-4 w-4 text-sea" aria-hidden="true" />
            Get access for the full example
          </Link>
        </div>

        <ReviewPacket
          packet={examplePacket}
          stepIds={LIMITED_EXAMPLE_STEP_IDS}
          title="Limited Preview Review"
          description="This public preview shows selected completed fields from the psychosocial intake workflow. The full completed example includes additional consents, ROI, home visit, discharge planning, and optional authorization sections."
        />
      </section>
    </main>
  );
}
