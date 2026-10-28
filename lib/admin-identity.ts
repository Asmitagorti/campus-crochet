export const DESIGNATED_ADMIN_EMAIL = "asmileis4evr@gmail.com";

export function isDesignatedAdminEmail(email: string | null | undefined) {
  return typeof email === "string" && email.toLowerCase() === DESIGNATED_ADMIN_EMAIL;
}

export function adminRoleForEmail(email: string | null | undefined) {
  return isDesignatedAdminEmail(email) ? "admin" : "customer";
}
