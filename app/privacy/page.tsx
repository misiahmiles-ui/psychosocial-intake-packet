import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import {
  PRIVACY_SECTIONS,
  PRIVACY_VERSION
} from "@/lib/legal/productFamilyLegal";

export const metadata: Metadata = {
  title: "Privacy Policy | Adult Day Intake Products",
  description: "Privacy practices for the Adult Day Intake product family."
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      description="How facility, staff-account, seat, billing, legal-acceptance, and technical information is handled across the Adult Day Intake product family."
      sections={PRIVACY_SECTIONS}
      title="Privacy Policy"
      version={PRIVACY_VERSION}
    />
  );
}
