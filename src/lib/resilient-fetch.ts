import { CircuitBreaker } from "@/lib/circuit-breaker";

export interface ResilientFetchOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelays?: number[];
  circuitBreaker?: CircuitBreaker;
  retryOn?: (response: Response) => boolean;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAYS = [2_000, 5_000];

function defaultRetryOn(response: Response): boolean {
  return response.status >= 500;
}

export async function resilientFetch(
  url: string,
  init: RequestInit,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelays = DEFAULT_RETRY_DELAYS,
    circuitBreaker,
    retryOn = defaultRetryOn,
  } = options;

  if (circuitBreaker && !circuitBreaker.canExecute()) {
    throw new Error("Circuit breaker is OPEN — request blocked");
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const mergedInit: RequestInit = {
        ...init,
        signal: controller.signal,
      };

      let response: Response;
      try {
        response = await fetch(url, mergedInit);
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok || !retryOn(response)) {
        circuitBreaker?.onSuccess();
        return response;
      }

      // 4xx — don't retry client errors
      if (response.status >= 400 && response.status < 500) {
        circuitBreaker?.onSuccess();
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    // Wait before retrying (skip wait on last attempt)
    if (attempt < maxRetries) {
      const delay = retryDelays[attempt] ?? retryDelays[retryDelays.length - 1];
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  circuitBreaker?.onFailure();
  throw lastError instanceof Error
    ? lastError
    : new Error("resilientFetch failed after retries");
}
