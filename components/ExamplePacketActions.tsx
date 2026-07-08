"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { examplePacket } from "@/lib/examplePacket";
import { buildPacketPdf, downloadBytes } from "@/lib/pdfExport";

type ExamplePacketActionsProps = {
  filenamePrefix?: string;
  stepIds?: string[];
  variant?: "preview" | "full";
};

export function ExamplePacketActions({
  filenamePrefix = "adult-day-intake-example",
  stepIds,
  variant = "full"
}: ExamplePacketActionsProps) {
  const [busy, setBusy] = useState<string | null>(null);

  async function downloadExampleDraft() {
    setBusy("draft");
    const bytes = await buildPacketPdf(examplePacket, "draft", { stepIds });
    downloadBytes(bytes, `${filenamePrefix}-editable-draft.pdf`);
    setBusy(null);
  }

  async function downloadExampleFinal() {
    setBusy("final");
    const bytes = await buildPacketPdf(examplePacket, "final", { stepIds });
    downloadBytes(bytes, `${filenamePrefix}-final.pdf`);
    setBusy(null);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={downloadExampleDraft}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b615b] disabled:opacity-60"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {busy === "draft"
          ? "Preparing..."
          : variant === "preview"
            ? "Download Preview Draft PDF"
            : "Download Full Example Draft PDF"}
      </button>
      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={downloadExampleFinal}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea disabled:opacity-60"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        {busy === "final"
          ? "Preparing..."
          : variant === "preview"
            ? "Download Preview Final PDF"
            : "Download Full Example Final PDF"}
      </button>
    </div>
  );
}
