export function afterGoogleDestination(requested: string | null, isAdmin: boolean): "/account" | "/admin" | "/vote" | null {
  if (requested === "/admin") return isAdmin ? "/admin" : "/account";
  if (requested === "/account" || requested === "/vote") return requested;
  return null;
}

export function hasLegacyAuthTokens(hash: string): boolean {
  if (!hash.startsWith("#")) return false;
  const params = new URLSearchParams(hash.slice(1));
  return ["access_token", "refresh_token", "provider_token", "provider_refresh_token"]
    .some((name) => params.has(name));
}

export function isSuccessfulGoogleCallback(startedWithCode: boolean, codeStillInUrl: boolean, hasSession: boolean, hasError: boolean): boolean {
  return startedWithCode && !codeStillInUrl && hasSession && !hasError;
}
