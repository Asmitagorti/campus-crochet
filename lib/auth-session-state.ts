type AccountCheck = { ok: boolean; admin?: boolean; error?: string };

export function sameSignedInAccount(previousUid: string | null, nextUid: string | null) {
  return previousUid !== null && previousUid === nextUid;
}

export function checkedSession<T>(user: T, check: AccountCheck): { user: T; admin: boolean; error: string } {
  return {
    user,
    admin: check.ok && check.admin === true,
    error: check.ok ? "" : check.error || "Your account could not be loaded. Please try again.",
  };
}
