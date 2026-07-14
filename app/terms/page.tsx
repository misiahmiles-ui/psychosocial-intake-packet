import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { TERMS_SECTIONS, TERMS_VERSION } from "@/lib/legal/productFamilyLegal";

export const metadata: Metadata = {
  title: "Terms of Service | Adult Day Intake Products",
  description: "Terms governing the Adult Day Intake product family."
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      description="Unified terms for the Psychosocial Intake, Nursing Intake, Complete Suite, facility accounts, named staff seats, PDF output, and related services."
      sections={TERMS_SECTIONS}
      title="Terms of Service"
      version={TERMS_VERSION}
    />
  );
}
