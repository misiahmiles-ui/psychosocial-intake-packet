export function normalizeSupabaseUrl(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  return trimmed.replace(/\/(?:rest|auth)\/v1$/i, "");
}
