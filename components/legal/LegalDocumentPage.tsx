import Link from "next/link";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_PROVIDER_NAME,
  type LegalSection
} from "@/lib/legal/productFamilyLegal";

type LegalDocumentPageProps = {
  description: string;
  sections: LegalSection[];
  title: string;
  version: string;
};

export function LegalDocumentPage({
  description,
  sections,
  title,
  version
}: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-[#d7dfdc] bg-[#173b59] text-white">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <Link className="text-sm font-bold text-[#d8eef0] hover:text-white" href="/">
            Adult Day Intake Products
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-normal">{title}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-[#e4edf2]">{description}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-[#d8eef0]">
            <span>Provider: {LEGAL_PROVIDER_NAME}</span>
            <span>Effective: {LEGAL_EFFECTIVE_DATE}</span>
            <span>Version: {version}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-8 sm:px-8">
        <nav aria-label="Legal documents" className="flex flex-wrap gap-3 rounded-lg border border-[#d7dfdc] bg-white p-4 shadow-sm">
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/terms">
            Terms of Service
          </Link>
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/signup">
            Create account
          </Link>
          <Link className="font-bold text-sea hover:text-[#0b615b]" href="/login">
            Sign in
          </Link>
        </nav>

        {sections.map((section) => (
          <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm" key={section.title}>
            <h2 className="text-xl font-bold text-[#173b59]">{section.title}</h2>
            <div className="mt-3 grid gap-3 leading-7 text-[#435665]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul className="ml-5 list-disc space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}

        <p className="rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
          Never send participant, member, patient, or protected health information when contacting the Provider about these documents.
        </p>
      </div>
    </main>
  );
}
