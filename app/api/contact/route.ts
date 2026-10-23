import { saveMessage } from "@/lib/database";
import { guard, text, email, errorResponse } from "@/lib/forms";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const b = await request.json();
    if (b.website) throw Error("Unable to send this message.");
    const name = text(b.name, 80),
      address = email(b.email),
      topic = text(b.topic, 80),
      message = text(b.message, 3000);
    if (name.length < 2 || message.length < 10)
      throw Error(
        "Please include your name and a message of at least 10 characters.",
      );
    if (
      ![
        "A product question",
        "My order",
        "A custom request",
        "Something else",
      ].includes(topic)
    )
      throw Error("Please choose a topic.");
    if (b.consent !== true)
      throw Error("Please agree to the privacy information.");
    const id = await saveMessage({ name, email: address, topic, message });
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
