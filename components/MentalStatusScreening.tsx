"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { IntakePacket, IntakeStep } from "@/types/intake";
import { scoreMentalStatus } from "@/lib/packetUtils";

const responseOptions = [
  { label: "Correct", value: "correct" },
  { label: "Incorrect", value: "incorrect" },
  { label: "Unable / refused", value: "unable" }
];

export function MentalStatusScreening({ step }: { step: IntakeStep }) {
  const { register, control } = useFormContext<IntakePacket>();
  const responses = useWatch({
    control,
    name: "mentalStatus.responses"
  });
  const screeningNote = useWatch({
    control,
    name: "mentalStatus.screeningNote"
  });

  const score = useMemo(
    () =>
      scoreMentalStatus({
        ...({} as IntakePacket),
        mentalStatus: {
          responses: responses ?? [],
          screeningNote: Boolean(screeningNote)
        }
      }),
    [responses, screeningNote]
  );

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

      <div className="mb-5 rounded-lg border border-[#cde7df] bg-mint p-4">
        <p className="font-bold text-sea">
          Total incorrect / unable-refused: {score.missed} of 10
        </p>
        <p className="mt-1 text-sm font-semibold text-[#334642]">
          Screening level: {score.level}
        </p>
      </div>

      <div className="grid gap-4">
        {responses?.map((response, index) => (
          <fieldset
            key={response.question}
            className="rounded-lg border border-[#d7dfdc] bg-[#fbfcfb] p-4"
          >
            <input
              type="hidden"
              {...register(`mentalStatus.responses.${index}.question` as never)}
            />
            <legend className="text-base font-bold text-ink">
              {index + 1}. {response.question}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {responseOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-[#d7dfdc] bg-white px-3 py-2 text-sm font-semibold text-[#334642]"
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="h-4 w-4 border-[#9fb0ab] accent-sea"
                    {...register(
                      `mentalStatus.responses.${index}.status` as never
                    )}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="field-label">Notes</span>
              <textarea
                className="field-input min-h-20"
                {...register(`mentalStatus.responses.${index}.notes` as never)}
              />
            </label>
          </fieldset>
        ))}
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-lg border border-[#d7dfdc] bg-white p-4 font-semibold text-[#334642]">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-[#9fb0ab] accent-sea"
          {...register("mentalStatus.screeningNote" as never)}
        />
        <span>
          I understand this screen is a screening aid only and is not a
          standalone diagnosis.
        </span>
      </label>
    </section>
  );
}
