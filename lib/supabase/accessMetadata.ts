import "server-only";

import { createSupabaseAdminClient } from "./server";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function metadataHasAccess(metadata: Record<string, unknown> | undefined) {
  return metadata?.has_access === true;
}

export async function updateUserAppMetadata(
  admin: SupabaseAdminClient,
  userId: string,
  updates: Record<string, unknown>
) {
  const {
    data: { user }
  } = await admin.auth.admin.getUserById(userId);
  const current = (user?.app_metadata ?? {}) as Record<string, unknown>;
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...current,
      ...cleanUpdates
    }
  });
}
