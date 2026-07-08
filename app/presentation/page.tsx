import type { Metadata } from "next";
import { WorkflowPresentation } from "@/components/presentation/WorkflowPresentation";

export const metadata: Metadata = {
  title: "Adult Day Intake Pro Presentation | Psychosocial Intake Workflow",
  description:
    "Automated in-app presentation for Adult Day Intake Pro workflow specifics and Standard Agency Access limits."
};

export default function PresentationPage() {
  return <WorkflowPresentation />;
}
