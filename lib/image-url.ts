export function validImage(value: unknown) {
  if (typeof value !== "string" || value.length > 1500) return false;
  try {
    const u = new URL(value);
    const project = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!project || /(?:\/\.\.?\/|%2e)/i.test(value)) return false;
    return (
      u.protocol === "https:" &&
      u.origin === new URL(project).origin &&
      u.pathname.startsWith("/storage/v1/object/public/product_images/") &&
      u.pathname.length > "/storage/v1/object/public/product_images/".length
    );
  } catch {
    return false;
  }
}
