export function saleCountdown(end: string | null, now: number) {
  if (!end) return null;
  const remaining = new Date(end).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return null;
  const seconds = Math.ceil(remaining / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds % 86400 / 3600),
    minutes: Math.floor(seconds % 3600 / 60),
    seconds: seconds % 60,
  };
}
