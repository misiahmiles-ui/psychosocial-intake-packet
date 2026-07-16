"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Printer } from "lucide-react";
import { buildPacketPdf, downloadBytes } from "@/lib/pdfExport";
import { examplePacket, marylandExamplePacket } from "@/lib/examplePacket";
import type { PsychosocialJurisdiction } from "@/types/intake";

export function OwnerExportTestPanel({
  jurisdiction
}: {
  jurisdiction: PsychosocialJurisdiction;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const packet = jurisdiction === "MD" ? marylandExamplePacket : examplePacket;
  const editionName = jurisdiction === "MD" ? "Maryland" : "New Jersey";

  async function testDraftPdf() {
    setMessage(null);
    setBusy("draft");
    try {
      const bytes = await buildPacketPdf(packet, "draft");
      downloadBytes(bytes, `owner-test-${jurisdiction.toLowerCase()}-editable-draft.pdf`);
      setMessage(`${editionName} editable draft PDF generated with fictitious demonstration data.`);
    } catch {
      setMessage("Editable draft PDF test could not be generated.");
    } finally {
      setBusy(null);
    }
  }

  async function testFinalPdf() {
    setMessage(null);
    setBusy("final");
    try {
      const bytes = await buildPacketPdf(packet, "final");
      downloadBytes(bytes, `owner-test-${jurisdiction.toLowerCase()}-final-packet.pdf`);
      setMessage(`${editionName} final PDF generated with fictitious demonstration data.`);
    } catch {
      setMessage("Final PDF test could not be generated.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold tracking-normal text-ink">
        Export Testing
      </h2>
      <p className="mt-2 leading-7 text-[#52645f]">
        These owner-only {editionName} test buttons use the existing production export logic
        with fictional demonstration data. No client/member responses are
        stored.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={testDraftPdf}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b615b] disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy === "draft" ? "Preparing..." : "Test Draft PDF"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={testFinalPdf}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea disabled:opacity-60"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          {busy === "final" ? "Preparing..." : "Test Final PDF"}
        </button>
        <Link
          href={`/owner/intake?mode=review&demo=1&print=1&edition=${jurisdiction}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Test Print Layout
        </Link>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={testDraftPdf}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Test Editable Export
        </button>
      </div>
      {message ? (
        <p className="mt-4 rounded-lg border border-[#cde7df] bg-mint p-3 text-sm font-semibold leading-6 text-[#334642]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
