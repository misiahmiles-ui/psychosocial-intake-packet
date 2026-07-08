"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Home, ShieldCheck } from "lucide-react";
import { defaultValues } from "@/lib/defaultValues";
import { INTAKE_STEPS } from "@/lib/sections";
import { getValueByPath, isMeaningfulValue } from "@/lib/packetUtils";
import {
  CREATOR_CREDIT,
  PRIVACY_NOTICE,
  PRODUCT_NAME,
  UNSAVED_WARNING
} from "@/lib/placeholders";
import type { IntakePacket, IntakeStep } from "@/types/intake";
import { ExportButtons } from "./ExportButtons";
import { FormSection } from "./FormSection";
import { IntakeStepper } from "./IntakeStepper";
import { ReviewPacket } from "./ReviewPacket";

export function IntakeApp() {
  const [activeIndex, setActiveIndex] = useState(0);
  const methods = useForm<IntakePacket>({
    defaultValues,
    mode: "onBlur"
  });
  const watchedPacket = useWatch({ control: methods.control }) as IntakePacket;

  const completedStepIds = useMemo(() => {
    const packet = watchedPacket ?? methods.getValues();
    return new Set(
      INTAKE_STEPS.filter((step) => isStepStarted(step, packet)).map(
        (step) => step.id
      )
    );
  }, [watchedPacket, methods]);

  const hasEnteredInfo = completedStepIds.size > 0;
  const isReview = activeIndex === INTAKE_STEPS.length;
  const activeStep = INTAKE_STEPS[activeIndex];
  const completionPercent = Math.round(
    (completedStepIds.size / INTAKE_STEPS.length) * 100
  );

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasEnteredInfo) {
        return;
      }

      event.preventDefault();
      event.returnValue = UNSAVED_WARNING;
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasEnteredInfo]);

  function clear() {
    methods.reset(defaultValues);
    setActiveIndex(0);
  }

  function confirmNavigationAway(event: MouseEvent<HTMLAnchorElement>) {
    if (hasEnteredInfo && !window.confirm(UNSAVED_WARNING)) {
      event.preventDefault();
    }
  }

  function goNext() {
    setActiveIndex((current) =>
      Math.min(current + 1, INTAKE_STEPS.length)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevious() {
    setActiveIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <FormProvider {...methods}>
      <main className="min-h-screen bg-cloud text-ink">
        <header className="no-print border-b border-[#d7dfdc] bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  onClick={confirmNavigationAway}
                  className="inline-flex items-center gap-2 text-sm font-bold text-sea hover:text-[#0b615b]"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  {PRODUCT_NAME}
                </Link>
                <Link
                  href="/example"
                  onClick={confirmNavigationAway}
                  className="text-sm font-bold text-[#52645f] hover:text-sea"
                >
                  Example
                </Link>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-normal">
                No-retention digital intake packet
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#52645f]">
                {CREATOR_CREDIT}
              </p>
            </div>
            <div className="rounded-lg border border-[#cde7df] bg-mint px-4 py-3 text-sm font-semibold text-[#334642]">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-sea" />
              {PRIVACY_NOTICE}
            </div>
          </div>
        </header>

        <div className="no-print mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[18rem_1fr] lg:px-10">
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className="mb-4 rounded-lg border border-[#d7dfdc] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-ink">Section progress</p>
                <p className="text-sm font-bold text-sea">
                  {completionPercent}%
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4ebe8]">
                <div
                  className="h-full rounded-full bg-sea"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[#667873]">
                Active browser session only. Download an Editable Draft PDF to
                keep unfinished work.
              </p>
            </div>
            <IntakeStepper
              steps={INTAKE_STEPS}
              activeIndex={activeIndex}
              completedStepIds={completedStepIds}
              onStepChange={setActiveIndex}
              onReview={() => setActiveIndex(INTAKE_STEPS.length)}
            />
          </aside>

          <div className="grid gap-5">
            <ExportButtons getPacket={methods.getValues} onClear={clear} />

            {isReview ? (
              <ReviewPacket packet={methods.getValues()} />
            ) : (
              <FormSection step={activeStep} />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={activeIndex === 0}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 font-bold text-ink transition hover:border-sea disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex === INTAKE_STEPS.length}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 font-bold text-white transition hover:bg-[#0b615b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="print-packet">
          <ReviewPacket packet={methods.getValues()} />
        </div>
      </main>
    </FormProvider>
  );
}

function isStepStarted(step: IntakeStep, packet: IntakePacket) {
  if (step.custom === "mental-status") {
    return isMeaningfulValue(packet.mentalStatus);
  }

  const fields = [
    ...(step.fields ?? []),
    ...(step.groups?.flatMap((group) => group.fields) ?? [])
  ];

  return fields.some((field) =>
    isMeaningfulValue(getValueByPath(packet, field.path))
  );
}
