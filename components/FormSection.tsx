"use client";

import type { IntakeStep } from "@/types/intake";
import { FieldInput } from "./FieldInput";
import { MentalStatusScreening } from "./MentalStatusScreening";

export function FormSection({ step }: { step: IntakeStep }) {
  if (step.custom === "mental-status") {
    return <MentalStatusScreening step={step} />;
  }

  return (
    <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-sea">
          {step.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-ink">
          {step.title}
        </h2>
        <p className="mt-2 max-w-3xl leading-7 text-[#52645f]">
          {step.description}
        </p>
      </div>

      {step.fields ? (
        <div className="form-grid">
          {step.fields.map((field) => (
            <FieldInput key={field.path} field={field} />
          ))}
        </div>
      ) : null}

      {step.groups?.map((group) => (
        <div
          key={group.title}
          className="mt-8 border-t border-[#e4ebe8] pt-6 first:mt-0 first:border-t-0 first:pt-0"
        >
          <h3 className="text-lg font-bold text-ink">{group.title}</h3>
          {group.description ? (
            <p className="mt-2 max-w-3xl leading-7 text-[#52645f]">
              {group.description}
            </p>
          ) : null}
          <div className="form-grid mt-5">
            {group.fields.map((field) => (
              <FieldInput key={field.path} field={field} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
