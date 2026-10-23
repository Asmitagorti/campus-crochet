export function validImage(value: unknown) {
  if (typeof value !== "string" || value.length > 1500) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith(
        `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`,
      )
    );
  } catch {
    return false;
  }
}
