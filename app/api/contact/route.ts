import { randomUUID } from "node:crypto";
import { adminDatabase } from "@/lib/supabase-admin";
import { guard, text, email, errorResponse } from "@/lib/forms";
import { readJsonBody } from "@/lib/request-body";
import { sendSupportEmail } from "@/lib/support-email";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const b = await readJsonBody(request);
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
    const { data, error } = await adminDatabase().from("support_tickets").insert({
      name,
      email: address,
      subject: topic,
      message,
      submission_key: randomUUID(),
    }).select("id").single();
    if (error) throw error;
    const id = data.id;
    let emailed = false;
    try {
      await sendSupportEmail(
        { id, name, email: address, subject: topic, message },
        process.env.RESEND_API_KEY || "",
        process.env.RESEND_FROM_EMAIL || "",
      );
      emailed = true;
    } catch (notifyError) {
      console.error("Support note email failed", id, notifyError);
    }
    return Response.json({ id, emailed }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
