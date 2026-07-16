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
      <p className="font-bold text-sea">Maryland psychosocial resources</p>
      <p className="mt-1">
        Use current Maryland forms maintained by the State for rights,
        consent, referrals, and other psychosocial coordination. This workflow
        tracks the social-work contribution and does not reproduce or replace
        required government forms.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <a className="font-bold text-sea underline" href="https://health.maryland.gov/ohcq/Pages/Adult-Medical-Day-Care-Resources.aspx" target="_blank" rel="noreferrer">
          Adult Medical Day Care resources
        </a>
        <a className="font-bold text-sea underline" href="https://health.maryland.gov/mmcp/longtermcare/Pages/Medical-Day-Care-Services.aspx?Mobile=1" target="_blank" rel="noreferrer">
          Medical Day Care forms
        </a>
        <a className="font-bold text-sea underline" href="https://regs.maryland.gov/us/md/exec/comar/10.12/index.full.html" target="_blank" rel="noreferrer">
          COMAR 10.12 regulations
        </a>
      </div>
    </aside>
  );
}
