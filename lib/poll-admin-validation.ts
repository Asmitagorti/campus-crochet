import { validImage } from "./image-url";

export function parsePollRoundDraft(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (title.length < 3 || title.length > 120) throw Error("Enter a poll title of 3–120 characters.");
  if (description.length > 1000) throw Error("Keep the poll introduction under 1,000 characters.");
  return { title, description };
}

export function parsePollOptionDraft(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
  const position = body.position;
  if (title.length < 2 || title.length > 100) throw Error("Enter a design name of 2–100 characters.");
  if (description.length > 500) throw Error("Keep the design note under 500 characters.");
  if (!validImage(imageUrl) || !new URL(imageUrl).pathname.startsWith("/storage/v1/object/public/product_images/poll/"))
    throw Error("Upload a separate poll photo for this design.");
  if (!Number.isInteger(position) || (position as number) < 0 || (position as number) > 1000)
    throw Error("Enter a valid display order.");
  return { title, description, imageUrl, position: position as number };
}
