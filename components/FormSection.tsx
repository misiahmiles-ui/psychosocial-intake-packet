"use client";

import type { IntakeStep } from "@/types/intake";
import { FieldInput } from "./FieldInput";
import { MentalStatusScreening } from "./MentalStatusScreening";
import { MARYLAND_OFFICIAL_RESOURCES } from "@/lib/psychosocialEditions";

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

      {step.id === "maryland-admission" ? <MarylandResourceNotice /> : null}

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

function MarylandResourceNotice() {
  return (
    <aside className="mb-6 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm leading-6 text-[#334642]">
      <p className="font-bold text-sea">Official Maryland resources</p>
      <p className="mt-1">
        Use the current Maryland forms maintained by the State. This workflow
        tracks completion and does not reproduce or replace required government
        forms.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <a className="font-bold text-sea underline" href={MARYLAND_OFFICIAL_RESOURCES.adultMedicalDayCare} target="_blank" rel="noreferrer">
          Adult Medical Day Care resources
        </a>
        <a className="font-bold text-sea underline" href={MARYLAND_OFFICIAL_RESOURCES.medicalDayCareServices} target="_blank" rel="noreferrer">
          Medical Day Care forms
        </a>
        <a className="font-bold text-sea underline" href={MARYLAND_OFFICIAL_RESOURCES.regulations} target="_blank" rel="noreferrer">
          COMAR 10.12 regulations
        </a>
        <a className="font-bold text-sea underline" href={MARYLAND_OFFICIAL_RESOURCES.adcaps} target="_blank" rel="noreferrer">
          Official ADCAPS form (RN completion required)
        </a>
      </div>
      <p className="mt-3 font-semibold">
        ADCAPS must be completed by a registered nurse. Psychosocial staff may
        contribute social history, home-environment, goals, referrals, and team
        planning information only within their credentials and agency policy.
      </p>
    </aside>
  );
}
