import type { IntakePacket } from "@/types/intake";
import { BRAND_PLACEHOLDERS } from "./placeholders";

export function getValueByPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function formatValue(value: unknown, blankLabel = "Not entered"): string {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : blankLabel;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value.trim() || blankLabel;
  }

  return blankLabel;
}

export function scoreMentalStatus(packet: IntakePacket) {
  const missed = packet.mentalStatus.responses.filter(
    (response) => response.status === "incorrect" || response.status === "unable"
  ).length;

  let level = "No impairment";
  if (missed >= 9) {
    level = "Severe impairment";
  } else if (missed >= 6) {
    level = "Moderate impairment";
  } else if (missed >= 3) {
    level = "Mild impairment";
  }

  return {
    missed,
    level
  };
}

export function companyName(packet: IntakePacket) {
  return packet.company.name.trim() || BRAND_PLACEHOLDERS.companyName;
}

export function companyFooter(packet: IntakePacket) {
  const parts = [
    packet.company.address,
    packet.company.cityStateZip,
    packet.company.phone,
    packet.company.email
  ].filter(Boolean);

  return packet.company.footerText.trim() || parts.join(" | ");
}

export function isMeaningfulValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(isMeaningfulValue);
  }

  return false;
}
