export function isGoogleOAuthSession(
  appMetadata: { provider?: string; providers?: string[] } | undefined,
  amr: unknown,
) {
  const hasGoogleIdentity = appMetadata?.provider === "google" || appMetadata?.providers?.includes("google") === true;
  return hasGoogleIdentity && Array.isArray(amr) && amr.some((entry) =>
    entry === "oauth" || (typeof entry === "object" && entry !== null && "method" in entry && entry.method === "oauth")
  );
}
