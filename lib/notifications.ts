import 'server-only';
import { getServiceRoleClient } from './server-db';
import { sendMail, SUPPORT_EMAIL } from './resend';
export async function queueNotification(eventKey: string, kind: string, payload: Record<string, string>, replyTo?: string) {
  const { error } = await getServiceRoleClient().from('notification_jobs').upsert({ event_key: eventKey, kind, recipient: SUPPORT_EMAIL, reply_to: replyTo || SUPPORT_EMAIL, payload }, { onConflict: 'event_key', ignoreDuplicates: true });
  if (error) throw error;
}
export async function deliverNotifications() {
  const db = getServiceRoleClient();
  const { data: jobs, error } = await db.rpc('cc_claim_notifications', { p_limit: 10 });
  if (error) throw error;
  for (const job of jobs || []) {
    const p = job.payload as Record<string, string>;
    try {
      const subject = job.kind === 'pickup' ? 'Your handmade order is ready for pickup' : job.kind === 'custom_request' ? `Custom request: ${p.item_name}` : `Support: ${p.subject}`;
      const content = job.kind === 'pickup' ? `Hello ${p.name || 'there'},\n\nYour Campus Crochet order #${p.order_id} is complete and ready for pickup.\n\nPickup location: ${p.location}\n${p.instructions || ''}\n\nView tracking: ${process.env.SITE_URL || 'https://campus-crochet.tech'}/orders` : Object.entries(p).map(([k,v]) => `${k.replaceAll('_',' ')}: ${v}`).join('\n');
      const providerId = await sendMail(job.recipient, subject, content, job.event_key, job.reply_to || SUPPORT_EMAIL);
      const { error: saveError } = await db.from('notification_jobs').update({ status: 'sent', provider_id: providerId, sent_at: new Date().toISOString(), last_error: null }).eq('id', job.id).eq('attempts', job.attempts);
      if (saveError) throw saveError;
    } catch {
      await db.from('notification_jobs').update({ status: 'failed', last_error: 'Email delivery failed. Check sender verification and retry.', next_attempt_at: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts)).toISOString() }).eq('id', job.id).eq('attempts', job.attempts);
    }
  }
}
