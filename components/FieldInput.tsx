"use client";

import { useId, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FieldDefinition, IntakePacket } from "@/types/intake";

export function FieldInput({ field }: { field: FieldDefinition }) {
  const inputId = useId();
  const { control, register, setValue } = useFormContext<IntakePacket>();
  const kind = field.kind ?? "text";
  const registration = register(field.path as never);
  const className = field.full ? "full" : "";
  const watchedValue = useWatch({
    control,
    name: field.path as never
  }) as unknown;

  if (kind === "logoUpload") {
    const logoValue = typeof watchedValue === "string" ? watchedValue : "";

    function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setValue(field.path as never, result as never, {
          shouldDirty: true,
          shouldTouch: true
        });
        event.target.value = "";
      };
      reader.readAsDataURL(file);
    }

    function clearLogo() {
      setValue(field.path as never, "" as never, {
        shouldDirty: true,
        shouldTouch: true
      });
    }

    return (
      <div className={className}>
        <input type="hidden" {...registration} />
        <span className={`field-label ${field.required ? "required-dot" : ""}`}>
          {field.label}
        </span>
        <label
          htmlFor={inputId}
          className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#aebfba] bg-white px-4 py-5 text-center transition hover:border-sea hover:bg-mint"
        >
          <ImagePlus className="h-7 w-7 text-sea" aria-hidden="true" />
          <span className="mt-2 text-sm font-bold text-ink">
            Click to Upload Logo
          </span>
          <span className="mt-1 text-xs font-semibold text-[#667873]">
            PNG, JPG, JPEG, or SVG
          </span>
        </label>
        <input
          id={inputId}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          className="sr-only"
          onChange={handleLogoChange}
        />
        {logoValue ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[#d7dfdc] bg-white p-3">
            <img
              src={logoValue}
              alt="Uploaded company logo preview"
              className="max-h-16 max-w-40 object-contain"
            />
            <button
              type="button"
              onClick={clearLogo}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#b9c7c3] px-3 py-2 text-sm font-bold text-ink transition hover:border-clay"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          </div>
        ) : null}
        {field.helpText ? (
          <span className="mt-2 block text-sm text-[#667873]">
            {field.helpText}
          </span>
        ) : null}
      </div>
    );
  }

  if (kind === "checkbox") {
    return (
      <label
        className={`flex min-h-12 items-center gap-3 rounded-lg border border-[#d7dfdc] bg-white px-4 py-3 font-semibold text-[#334642] ${className}`}
      >
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[#9fb0ab] accent-sea"
          {...registration}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (kind === "checkboxGroup") {
    return (
      <fieldset className={className}>
        <legend className="field-label">{field.label}</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {field.options?.map((option) => (
            <label
              key={option.value}
              className="flex min-h-12 items-center gap-3 rounded-lg border border-[#d7dfdc] bg-white px-4 py-3 text-sm font-semibold text-[#334642]"
            >
              <input
                type="checkbox"
                value={option.value}
                className="h-5 w-5 rounded border-[#9fb0ab] accent-sea"
                {...registration}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {field.helpText ? (
          <p className="mt-2 text-sm text-[#667873]">{field.helpText}</p>
        ) : null}
      </fieldset>
    );
  }

  if (kind === "radio") {
    return (
      <fieldset className={className}>
        <legend
          className={`field-label ${field.required ? "required-dot" : ""}`}
        >
          {field.label}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {field.options?.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-[#d7dfdc] bg-white px-3 py-2 text-sm font-semibold text-[#334642]"
            >
              <input
                type="radio"
                value={option.value}
                className="h-4 w-4 border-[#9fb0ab] accent-sea"
                {...registration}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className={className} htmlFor={inputId}>
      <span className={`field-label ${field.required ? "required-dot" : ""}`}>
        {field.label}
      </span>
      {kind === "textarea" ? (
        <textarea
          id={inputId}
          className="field-input"
          placeholder={field.placeholder}
          {...registration}
        />
      ) : (
        <input
          id={inputId}
          type={kind}
          className="field-input"
          placeholder={field.placeholder}
          {...registration}
        />
      )}
      {field.helpText ? (
        <span className="mt-2 block text-sm text-[#667873]">
          {field.helpText}
        </span>
      ) : null}
    </label>
  );
}
