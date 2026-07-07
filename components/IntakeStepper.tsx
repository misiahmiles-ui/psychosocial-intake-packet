"use client";

import { CheckCircle2 } from "lucide-react";
import type { IntakeStep } from "@/types/intake";

type IntakeStepperProps = {
  steps: IntakeStep[];
  activeIndex: number;
  completedStepIds: Set<string>;
  onStepChange: (index: number) => void;
  onReview: () => void;
};

export function IntakeStepper({
  steps,
  activeIndex,
  completedStepIds,
  onStepChange,
  onReview
}: IntakeStepperProps) {
  return (
    <nav aria-label="Intake steps" className="grid gap-2">
      {steps.map((step, index) => {
        const active = activeIndex === index;
        const complete = completedStepIds.has(step.id);

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(index)}
            className={`grid min-h-12 grid-cols-[1.75rem_1fr] items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
              active
                ? "border-sea bg-mint text-sea"
                : "border-[#d7dfdc] bg-white text-[#40524e] hover:border-sea"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                complete ? "bg-sea text-white" : "bg-[#edf4f3] text-[#52645f]"
              }`}
            >
              {complete ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {step.shortTitle}
              </span>
              <span className="block text-xs opacity-75">{step.eyebrow}</span>
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onReview}
        className={`mt-2 min-h-12 rounded-lg border px-3 py-2 text-left font-bold transition ${
          activeIndex === steps.length
            ? "border-clay bg-[#fff1ea] text-clay"
            : "border-[#d7dfdc] bg-white text-[#40524e] hover:border-clay"
        }`}
      >
        Review & Export
      </button>
    </nav>
  );
}
