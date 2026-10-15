type LimitResult = {data: boolean | null; error: {code?: string; message?: string} | null};
type Allow = (key: string) => boolean;

// Only used before the database migration on a local development server.
// Production always requires the shared database limiter.
export function createWindowLimiter(limit: number, windowMs: number, now = Date.now): Allow {
  const attempts = new Map<string, {count: number; expires: number}>();
  return key => {
    const time = now();
    for (const [storedKey, value] of attempts) if (value.expires <= time) attempts.delete(storedKey);
    const entry = attempts.get(key);
    if (entry) {
      if (entry.count >= limit) return false;
      entry.count++;
      return true;
    }
    if (attempts.size >= 10000) return false;
    attempts.set(key, {count: 1, expires: time + windowMs});
    return true;
  };
}

const runtime = globalThis as typeof globalThis & {ccDevelopmentOtpLimiter?: Allow};
function developmentLimiter(key: string) {
  runtime.ccDevelopmentOtpLimiter ||= createWindowLimiter(3, 600000);
  return runtime.ccDevelopmentOtpLimiter(key);
}

export async function allowOtp(
  check: () => PromiseLike<LimitResult>,
  key: string,
  environment: string | undefined = process.env.NODE_ENV,
  localAllow: Allow = developmentLimiter,
) {
  const {data, error} = await check();
  if (!error) return data === true;
  const missingFunction = error.code === 'PGRST202' || error.code === '42883';
  if (environment === 'development' && missingFunction) return localAllow(key);
  throw error;
}
