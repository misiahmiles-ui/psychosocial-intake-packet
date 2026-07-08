import type { Metadata } from "next";
import { AdultDayIntakeProMarketing } from "@/components/marketing/AdultDayIntakeProMarketing";

export const metadata: Metadata = {
  title:
    "Adult Day Intake Pro™ | Psychosocial Intake & PDF Documentation Workflow",
  description:
    "Standard Agency Access for the hosted Adult Day Intake Pro™ psychosocial intake and PDF documentation workflow."
};

export default function PsychosocialIntakePacketPage() {
  return <AdultDayIntakeProMarketing />;
}
