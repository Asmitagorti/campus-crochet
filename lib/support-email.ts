export type SupportNote = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

export function composeSupportEmail(note: SupportNote) {
  return {
    to: ["support@campus-crochet.tech"],
    reply_to: note.email,
    subject: `New website note · ${note.subject} · Campus Crochet`,
    text: `A visitor sent a note through Campus Crochet.\n\nReference: ${note.id}\nName: ${note.name}\nEmail: ${note.email}\nTopic: ${note.subject}\n\n${note.message}\n\nYou can also find this note in the admin dashboard.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto"><h1>New website note</h1><p><strong>Reference:</strong> ${escapeHtml(note.id)}<br><strong>Name:</strong> ${escapeHtml(note.name)}<br><strong>Email:</strong> ${escapeHtml(note.email)}<br><strong>Topic:</strong> ${escapeHtml(note.subject)}</p><p style="white-space:pre-wrap">${escapeHtml(note.message)}</p><p>This note is also saved in the admin dashboard.</p></div>`,
  };
}

export async function sendSupportEmail(
  note: SupportNote,
  apiKey: string,
  from: string,
  transport: typeof fetch = fetch,
) {
  if (!apiKey || !from) throw Error("Support email is not configured.");
  const response = await transport("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `support-note/${note.id}`,
    },
    body: JSON.stringify({ from, ...composeSupportEmail(note) }),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.id !== "string")
    throw Error(`Resend rejected the support note (${response.status}).`);
  return result.id as string;
}
