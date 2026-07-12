import type { Metadata } from "next";
import { OwnerIntakeReview } from "@/components/owner/OwnerIntakeReview";
import type { IntakeAccessMode } from "@/components/IntakeApp";
import { examplePacket } from "@/lib/examplePacket";
import { INTAKE_STEPS } from "@/lib/sections";

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
  }>;
};

export default async function OwnerIntakePage({
  searchParams
}: OwnerIntakePageProps) {
  const params = await searchParams;
  const accessMode: IntakeAccessMode =
    params?.mode === "buyer" ? "owner-buyer-preview" : "owner-review";
  const initialStepIndex = normalizeStepIndex(params?.step);
  const demonstrationLoaded = params?.demo === "1";

  return (
    <OwnerIntakeReview
      accessMode={accessMode}
      autoPrint={params?.print === "1"}
      demonstrationLoaded={demonstrationLoaded}
      initialPacket={demonstrationLoaded ? examplePacket : undefined}
      initialStepIndex={initialStepIndex}
    />
  );
}

function normalizeStepIndex(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), INTAKE_STEPS.length);
}
