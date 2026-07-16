export type AuthorizedPsychosocialJurisdiction = "NJ" | "MD";

export function normalizeAuthorizedJurisdictions(
  raw: unknown,
  isOwner: boolean
): AuthorizedPsychosocialJurisdiction[] {
  if (isOwner) return ["NJ", "MD"];

  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? [raw]
      : [];
  const normalized = values
    .map((value) => String(value).toUpperCase())
    .filter(
      (value): value is AuthorizedPsychosocialJurisdiction =>
        value === "NJ" || value === "MD"
    );

  return normalized.length ? Array.from(new Set(normalized)) : ["NJ"];
}
