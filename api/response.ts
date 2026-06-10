export const unwrapData = <T>(payload: unknown): T => {
  const value = payload as { data?: unknown; quote?: unknown; invoice?: unknown };

  if (value?.data !== undefined) return value.data as T;
  if (value?.quote !== undefined) return value.quote as T;
  if (value?.invoice !== undefined) return value.invoice as T;

  return payload as T;
};
