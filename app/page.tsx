import type { Metadata } from "next";
import { AdultDayIntakeProMarketing } from "@/components/marketing/AdultDayIntakeProMarketing";

export const metadata: Metadata = {
  title:
    "Adult Day Intake Pro™ | Psychosocial Intake & PDF Documentation Workflow",
  description:
    "A structured digital psychosocial intake and PDF documentation workflow for adult day care and adult medical daycare programs."
};

export default function Home() {
  return <AdultDayIntakeProMarketing />;
}
