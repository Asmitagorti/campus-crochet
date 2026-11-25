export function afterGoogleDestination(requested: string | null, isAdmin: boolean): string | null {
  if (requested === "/admin") return isAdmin ? "/admin" : "/account";
  if (requested === "/account" || requested === "/vote") return requested;
  if (requested?.startsWith("/checkout")) {
    const url = new URL(requested, "https://campus-crochet.invalid");
    if (url.origin !== "https://campus-crochet.invalid" || url.pathname !== "/checkout") return null;
    if ([...url.searchParams.keys()].some((key) => !["buy", "quantity", "color"].includes(key))) return null;
    const buy = url.searchParams.get("buy");
    const quantity = url.searchParams.get("quantity");
    const color = url.searchParams.get("color");
    if (buy && !/^[a-z0-9-]{1,80}$/.test(buy)) return null;
    if (quantity && (!/^\d{1,2}$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 20)) return null;
    if (color && (color.length > 40 || /[\x00-\x1f\x7f]/.test(color))) return null;
    return requested;
  }
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
