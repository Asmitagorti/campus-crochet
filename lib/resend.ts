import 'server-only';
import { Resend } from 'resend';
export const SUPPORT_EMAIL = 'support@campus-crochet.tech';
export function getResendClient() {
  if (!process.env.RESEND_API_KEY) throw new Error('Email delivery is not configured');
  return new Resend(process.env.RESEND_API_KEY);
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
export async function sendMail(to: string, subject: string, content: string, key: string, replyTo = SUPPORT_EMAIL) {
  const { data, error } = await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Campus Crochet <notifications@campus-crochet.tech>',
    to, replyTo, subject, text: content,
    html: `<div style="font-family:Arial,sans-serif;color:#243d34;max-width:560px;margin:auto;padding:32px;border:1px solid #d6ded9;border-radius:16px"><p style="font-size:12px;letter-spacing:2px">CAMPUS CROCHET</p><h1 style="font-size:24px">${escapeHtml(subject)}</h1><p style="line-height:1.7;white-space:pre-line">${escapeHtml(content)}</p><hr style="border:0;border-top:1px solid #d6ded9"><p style="font-size:12px">Questions? ${SUPPORT_EMAIL}</p></div>`
  }, { idempotencyKey: key });
  if (error) throw new Error(error.message);
  return data?.id;
}
export async function sendOTPEmail({ to, otp }: { to: string; otp: string }) {
  try { await sendMail(to, 'Your sign-in code', `Your Campus Crochet sign-in code is ${otp}.\n\nUse this code to finish signing in. If you did not request it, ignore this email.`, `otp/${to}/${otp}`); return { success: true }; }
  catch { return { success: false, error: 'Unable to deliver your sign-in code. Try again shortly.' }; }
}
