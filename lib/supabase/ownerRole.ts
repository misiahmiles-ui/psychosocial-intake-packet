import "server-only";

export type AccountRole = "buyer" | "owner";

export const OWNER_ROLE: AccountRole = "owner";
export const BUYER_ROLE: AccountRole = "buyer";

export function metadataHasOwnerRole(
  metadata: Record<string, unknown> | undefined
) {
  return metadata?.account_role === OWNER_ROLE || metadata?.owner_access === true;
}

export function normalizeAccountRole(value: unknown): AccountRole {
  return value === OWNER_ROLE ? OWNER_ROLE : BUYER_ROLE;
}

export function isOwnerRole({
  appMetadata,
  profileRole
}: {
  appMetadata: Record<string, unknown> | undefined;
  profileRole: unknown;
}) {
  return normalizeAccountRole(profileRole) === OWNER_ROLE ||
    metadataHasOwnerRole(appMetadata);
}
