import "server-only";

export type AccountRole = "buyer" | "owner";

export const OWNER_ROLE: AccountRole = "owner";
export const BUYER_ROLE: AccountRole = "buyer";

type OwnerAuthorizationSource = "profile" | "app_metadata" | "none";

export type OwnerAuthorizationResult = {
  accountRole: AccountRole;
  isOwner: boolean;
  source: OwnerAuthorizationSource;
};

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
  return resolveOwnerAuthorization({ appMetadata, profileRole }).isOwner;
}

export function resolveOwnerAuthorization({
  appMetadata,
  profileRole
}: {
  appMetadata: Record<string, unknown> | undefined;
  profileRole: unknown;
}): OwnerAuthorizationResult {
  const profileIsOwner = normalizeAccountRole(profileRole) === OWNER_ROLE;
  const metadataIsOwner = metadataHasOwnerRole(appMetadata);
  const isOwner = profileIsOwner || metadataIsOwner;

  return {
    accountRole: isOwner ? OWNER_ROLE : BUYER_ROLE,
    isOwner,
    source: profileIsOwner
      ? "profile"
      : metadataIsOwner
        ? "app_metadata"
        : "none"
  };
}
