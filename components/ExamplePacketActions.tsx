import { Download, FileText } from "lucide-react";

export function ExamplePacketActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="/examples/adult-day-psychosocial-example-draft-preview.pdf"
        download
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0b615b]"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download Example Draft PDF (2 Pages)
      </a>
      <a
        href="/examples/adult-day-psychosocial-example-final-preview.pdf"
        download
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-sea"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
        Download Example Final PDF (2 Pages)
      </a>
    </div>
  );
}
