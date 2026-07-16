"use client";

import type { FieldDefinition, IntakePacket, IntakeStep } from "@/types/intake";
import {
  getIntakeSteps,
  JURISDICTION_LABELS,
  resolvePsychosocialJurisdiction
} from "@/lib/psychosocialEditions";
import { formatValue, getValueByPath, scoreMentalStatus } from "@/lib/packetUtils";

export function ReviewPacket({
  packet,
  publicPreview = false
}: {
  packet: IntakePacket;
  publicPreview?: boolean;
}) {
  const jurisdiction = resolvePsychosocialJurisdiction(packet);
  const intakeSteps = getIntakeSteps(jurisdiction);
  const visibleSteps = publicPreview ? intakeSteps.slice(0, 2) : intakeSteps;

  return (
    <section className="rounded-lg border border-[#d7dfdc] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay">
          {publicPreview ? "Limited Preview" : "Review"}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-ink">
          {publicPreview ? "Packet Review Preview" : "Packet Review"}
        </h2>
        {!publicPreview ? (
          <p className="mt-2 text-sm font-bold text-sea">
            {JURISDICTION_LABELS[jurisdiction]}
          </p>
        ) : null}
        <p className="mt-2 max-w-3xl leading-7 text-[#52645f]">
          {publicPreview
            ? "This public page displays only two sample sections. The complete packet review is available only inside the protected purchaser workflow."
            : "Review entries before printing or exporting. Blank fields are kept visibly blank in downloaded packet output."}
        </p>
      </div>

      <div className="grid gap-4">
        {visibleSteps.map((step) => (
          <ReviewStep
            key={step.id}
            step={step}
            packet={packet}
            watermarked={publicPreview}
          />
        ))}
      </div>
      {publicPreview ? (
        <p className="mt-5 rounded-lg border border-[#cde7df] bg-mint p-4 text-sm font-semibold leading-6 text-[#334642]">
          Public preview limited to 2 of {intakeSteps.length} sections. Sample
          content is fictitious and is not for clinical use.
        </p>
      ) : null}
    </section>
  );
}

function ReviewStep({
  step,
  packet,
  watermarked = false
}: {
  step: IntakeStep;
  packet: IntakePacket;
  watermarked?: boolean;
}) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-[#e4ebe8] bg-[#fbfcfb] p-4">
      {watermarked ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
        >
          <span className="-rotate-12 whitespace-nowrap text-2xl font-black tracking-[0.16em] text-sea/15 sm:text-4xl">
            SAMPLE PREVIEW - NOT FOR CLINICAL USE
          </span>
        </div>
      ) : null}
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-ink">
          {step.eyebrow}: {step.title}
        </h3>
        {step.custom === "mental-status" ? (
          <MentalStatusReview packet={packet} />
        ) : (
          <div className="mt-4 grid gap-3">
          {step.fields ? <FieldReview fields={step.fields} packet={packet} /> : null}
          {step.groups?.map((group) => (
            <div key={group.title} className="border-t border-[#e4ebe8] pt-4">
              <h4 className="font-bold text-[#334642]">{group.title}</h4>
              <div className="mt-3 grid gap-3">
                <FieldReview fields={group.fields} packet={packet} />
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </article>
  );
}

function FieldReview({
  fields,
  packet
}: {
  fields: FieldDefinition[];
  packet: IntakePacket;
}) {
  return (
    <>
      {fields.map((field) => (
        <div
          key={field.path}
          className="grid gap-1 rounded-lg border border-[#e4ebe8] bg-white p-3 sm:grid-cols-[0.42fr_0.58fr]"
        >
          <dt className="text-sm font-bold text-[#40524e]">{field.label}</dt>
          <FieldReviewValue field={field} packet={packet} />
        </div>
      ))}
    </>
  );
}

function FieldReviewValue({
  field,
  packet
}: {
  field: FieldDefinition;
  packet: IntakePacket;
}) {
  const value = getValueByPath(packet, field.path);

  if (field.kind === "logoUpload") {
    return (
      <dd className="text-sm text-ink">
        {typeof value === "string" && value ? (
          <img
            src={value}
            alt="Uploaded company logo"
            className="max-h-20 max-w-48 object-contain"
          />
        ) : (
          "Not uploaded"
        )}
      </dd>
    );
  }

  return (
    <dd className="whitespace-pre-wrap text-sm text-ink">
      {formatValue(value)}
    </dd>
  );
}

function MentalStatusReview({ packet }: { packet: IntakePacket }) {
  const score = scoreMentalStatus(packet);

  return (
    <div className="mt-4 grid gap-3">
      <div className="rounded-lg border border-[#cde7df] bg-mint p-3">
        <p className="font-bold text-sea">
          Total incorrect / unable-refused: {score.missed} of 10
        </p>
        <p className="text-sm font-semibold text-[#334642]">
          Screening result: {score.level}
        </p>
      </div>
      {packet.mentalStatus.responses.map((response, index) => (
        <div
          key={response.question}
          className="rounded-lg border border-[#e4ebe8] bg-white p-3"
        >
          <p className="font-bold text-[#334642]">
            {index + 1}. {response.question}
          </p>
          <p className="mt-1 text-sm text-ink">
            {formatValue(
              response.status
                ? response.status.replace("unable", "Unable / refused")
                : ""
            )}
          </p>
          {response.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#52645f]">
              Notes: {response.notes}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
