import type { Metadata } from "next";
import { OwnerIntakeReview } from "@/components/owner/OwnerIntakeReview";
import type { IntakeAccessMode } from "@/components/IntakeApp";
import { examplePacket, marylandExamplePacket } from "@/lib/examplePacket";
import { getIntakeSteps } from "@/lib/psychosocialEditions";
import type { PsychosocialJurisdiction } from "@/types/intake";

export const metadata: Metadata = {
  title: "Owner Workflow Review | Adult Day Intake Pro",
  description:
    "Owner-only workflow review and product inspection for Adult Day Intake Pro."
};

type OwnerIntakePageProps = {
  searchParams?: Promise<{
    demo?: string;
    mode?: string;
    print?: string;
    step?: string;
    edition?: string;
  }>;
};

export default async function OwnerIntakePage({
  searchParams
}: OwnerIntakePageProps) {
  const params = await searchParams;
  const accessMode: IntakeAccessMode =
    params?.mode === "buyer" ? "owner-buyer-preview" : "owner-review";
  const demonstrationLoaded = params?.demo === "1";
  const jurisdiction: PsychosocialJurisdiction =
    params?.edition?.toUpperCase() === "MD" ? "MD" : "NJ";
  const initialStepIndex = normalizeStepIndex(params?.step, jurisdiction);

  return (
    <OwnerIntakeReview
      accessMode={accessMode}
      autoPrint={params?.print === "1"}
      demonstrationLoaded={demonstrationLoaded}
      initialPacket={
        demonstrationLoaded
          ? jurisdiction === "MD"
            ? marylandExamplePacket
            : examplePacket
          : undefined
      }
      initialStepIndex={initialStepIndex}
      jurisdiction={jurisdiction}
    />
  );
}

function normalizeStepIndex(
  value: string | undefined,
  jurisdiction: PsychosocialJurisdiction
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), getIntakeSteps(jurisdiction).length);
}
