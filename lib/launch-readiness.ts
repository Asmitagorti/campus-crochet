type LaunchEnvironment = Record<string, string | undefined>;

export function launchReadiness(environment: LaunchEnvironment) {
  const livePayments = !!environment.RAZORPAY_KEY_ID?.startsWith("rzp_live_") && !!environment.RAZORPAY_KEY_SECRET;
  const email = !!environment.RESEND_API_KEY && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(environment.RESEND_FROM_EMAIL || "");
  const webhook = (environment.RAZORPAY_WEBHOOK_SECRET?.length || 0) >= 24;
  const reconciliation = (environment.CRON_SECRET?.length || 0) >= 16;
  return { livePayments, email, webhook, reconciliation,
    ready: livePayments && email && webhook && reconciliation };
}
