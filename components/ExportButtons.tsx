"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Printer,
  Trash2
} from "lucide-react";
import type { IntakePacket } from "@/types/intake";
import { buildPacketPdf, downloadBytes } from "@/lib/pdfExport";
import { EXPORT_PRIVACY_NOTICE, UNSAVED_WARNING } from "@/lib/placeholders";

type ExportButtonsProps = {
  getPacket: () => IntakePacket;
  onClear: () => void;
};

export function ExportButtons({
  getPacket,
  onClear
}: ExportButtonsProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function downloadDraftPdf() {
    setMessages([]);
    setBusy("draft");
    try {
      const bytes = await buildPacketPdf(getPacket(), "draft");
      downloadBytes(bytes, "adult-day-intake-editable-draft.pdf");
    } catch {
      setMessages([
        "Editable Draft PDF could not be generated. Please try again, or use Print to save a PDF while the entry remains open."
      ]);
    } finally {
      setBusy(null);
    }
  }

  async function exportFinalPdf() {
    const packet = getPacket();

    setMessages([]);
    setBusy("final");
    try {
      const bytes = await buildPacketPdf(packet, "final");
      downloadBytes(bytes, "adult-day-intake-final-packet.pdf");
    } catch {
      setMessages([
        "Final PDF could not be generated. Please try again, or use Print to save the packet as a PDF while the entry remains open."
      ]);
    } finally {
      setBusy(null);
    }
  }

  function clear() {
    if (window.confirm(UNSAVED_WARNING)) {
      setMessages([]);
      onClear();
    }
  }

  const disabled = Boolean(busy);

  return (
    <div className="rounded-lg border border-[#d7dfdc] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={downloadDraftPdf}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b615b]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy === "draft" ? "Preparing..." : "Download Editable Draft PDF"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={exportFinalPdf}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea disabled:opacity-60"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          {busy === "final" ? "Preparing..." : "Export Final PDF"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea disabled:opacity-60"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] px-4 py-2 text-sm font-bold text-clay transition hover:border-clay"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear Form
        </button>
      </div>

      <p className="mt-4 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
        {EXPORT_PRIVACY_NOTICE}
      </p>

      <p className="mt-3 rounded-lg border border-[#f0d3c8] bg-[#fff8f5] p-3 text-sm leading-6 text-[#643524]">
        Draft PDF note: Most typed responses remain editable in the downloaded
        PDF. Checkbox, multiple-choice, and scoring items will also show a
        written selected-answer summary so the information remains clear across
        PDF viewers. For best results, open editable draft PDFs with Adobe
        Acrobat Reader.
      </p>

      {messages.length ? (
        <div className="mt-4 rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4">
          <p className="font-bold text-clay">PDF export message:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#643524]">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
