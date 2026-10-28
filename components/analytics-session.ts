let stopped = false;
const pending = new Set<Promise<unknown>>();

export function analyticsStopped() { return stopped; }
export function trackAnalyticsRequest<T>(request: Promise<T>): Promise<T> {
  pending.add(request);
  void request.finally(() => pending.delete(request)).catch(() => {});
  return request;
}
export async function stopAnalyticsAndDrain() {
  stopped = true;
  await Promise.allSettled([...pending]);
}
