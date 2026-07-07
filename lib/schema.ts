import { z } from "zod";
import type { IntakePacket } from "@/types/intake";

const optionalDate = z
  .string()
  .optional()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Use a valid date."
  });

const optionalPhone = z
  .string()
  .optional()
  .refine((value) => !value || /^[0-9()+\-.\s]{7,}$/.test(value), {
    message: "Use a valid phone number."
  });

const optionalEmail = z
  .string()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Use a valid email address."
  });

export const draftSchema = z.object({
  company: z.object({
    name: z.string().optional(),
    phone: optionalPhone,
    fax: optionalPhone,
    email: optionalEmail,
    therapyProviderPhone: optionalPhone,
    therapyProviderEmail: optionalEmail
  }).passthrough(),
  identifying: z.object({
    participantName: z.string().optional(),
    dateOfBirth: optionalDate,
    dateOfIntake: optionalDate
  }).passthrough(),
  homeVisit: z.object({
    phone: optionalPhone,
    cell: optionalPhone,
    email: optionalEmail,
    dob: optionalDate
  }).passthrough(),
  roi: z.object({
    phone: optionalPhone,
    dateOfBirth: optionalDate,
    recipientPhone: optionalPhone,
    recipientFax: optionalPhone,
    date: optionalDate,
    witnessDate: optionalDate
  }).passthrough(),
  quarterlyDischarge: z.object({
    admissionDate: optionalDate,
    date: optionalDate
  }).passthrough()
}).passthrough();

export function validateDraft(packet: IntakePacket): string[] {
  const result = draftSchema.safeParse(packet);
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

export function validateFinalPacket(packet: IntakePacket): string[] {
  const issues = validateDraft(packet);

  if (!packet.identifying.participantName.trim()) {
    issues.push("Participant name is required before final PDF export.");
  }

  if (!packet.identifying.dateOfBirth.trim()) {
    issues.push("Date of birth is required before final PDF export.");
  }

  if (!packet.identifying.dateOfIntake.trim()) {
    issues.push("Date of intake is required before final PDF export.");
  }

  const hasParticipantSignature =
    packet.consents.medicalRelease.participantSignature.trim() ||
    packet.consents.medicalRelease.responsiblePartySignature.trim();

  if (!hasParticipantSignature) {
    issues.push(
      "A participant or responsible party signature is required in the medical release consent."
    );
  }

  if (!packet.consents.medicalRelease.date.trim()) {
    issues.push("The medical release consent date is required.");
  }

  if (!asText(packet.initialDischarge.socialServicesSignature).trim()) {
    issues.push("Social services signature is required before final export.");
  }

  if (!asText(packet.initialDischarge.socialServicesDate).trim()) {
    issues.push("Social services signature date is required before final export.");
  }

  if (!packet.mentalStatus.screeningNote) {
    issues.push("Acknowledge that the mental status screen is a screening aid.");
  }

  return issues;
}

function asText(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
