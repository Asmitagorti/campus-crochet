const transientCodes = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "UND_ERR_SOCKET", "UND_ERR_HEADERS_TIMEOUT"]);

export async function retryTransient<T>(
  action: () => Promise<T>,
  { attempts = 4, delayMs = 500 }: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await action();
    } catch (error) {
      const detail = error as { code?: string; cause?: { code?: string } };
      if (attempt >= attempts || !transientCodes.has(detail.code || detail.cause?.code || "")) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** (attempt - 1)));
    }
  }
}
