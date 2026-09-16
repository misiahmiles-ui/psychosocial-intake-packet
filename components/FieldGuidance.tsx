"use client";

import { useId, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import type { FieldGuidance as FieldGuidanceContent } from "@/lib/fieldGuidance";

export function FieldGuidance({
  guidance
}: {
  guidance: FieldGuidanceContent | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  if (!guidance) {
    return null;
  }

  return (
    <div className="field-guidance mt-2">
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-bold text-sea transition hover:bg-mint"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>What should I ask/document?</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={expanded ? "mt-2 rounded-lg border border-[#cde7df] bg-mint p-4" : "hidden"}
        id={contentId}
      >
        <GuidanceBlock label="What to ask" value={guidance.ask} />
        <GuidanceBlock label="What to document" value={guidance.document} />
        {guidance.caution ? (
          <GuidanceBlock label="Documentation caution" value={guidance.caution} />
        ) : null}
      </div>
    </div>
  );
}

function GuidanceBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-sea">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#334642]">{value}</p>
    </div>
  );
}
