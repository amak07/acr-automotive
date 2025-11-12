/**
 * Test Helper: Retry Logic for PostgREST Cache Delays
 *
 * PostgREST Issue:
 * When RPC functions with SECURITY DEFINER write data to Postgres,
 * PostgREST may not immediately see the committed changes due to
 * transaction isolation and schema caching.
 *
 * This helper retries SELECT queries with exponential backoff to
 * handle PostgREST's eventual consistency behavior.
 *
 * Usage:
 *   const part = await retryQuery(() =>
 *     supabase.from('parts').select('*').eq('id', partId).single()
 *   );
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelayMs: 50,
  maxDelayMs: 200,
  timeoutMs: 1000,
};

/**
 * Retry a Supabase query until data is returned or max retries reached
 *
 * @param queryFn - Function that returns a Supabase query promise
 * @param options - Retry configuration options
 * @returns The query result with data populated
 * @throws Error if max retries exceeded or timeout reached
 */
export async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // Check timeout
    if (Date.now() - startTime > opts.timeoutMs) {
      throw new Error(
        `retryQuery timeout after ${opts.timeoutMs}ms (${attempt} attempts)`
      );
    }

    // Execute query
    const result = await queryFn();

    // Return immediately if data found or error occurred
    if (result.data !== null || result.error !== null) {
      return result;
    }

    // Data is null and no error - PostgREST cache delay
    // Wait before retrying (exponential backoff)
    if (attempt < opts.maxRetries) {
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(1.5, attempt),
        opts.maxDelayMs
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Max retries exceeded - return last result (data will be null)
  const finalResult = await queryFn();
  return finalResult;
}

/**
 * Retry a Supabase query that returns multiple rows
 *
 * @param queryFn - Function that returns a Supabase query promise
 * @param options - Retry configuration options
 * @returns The query result with data populated
 */
export async function retryQueryMany<T>(
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T[] | null; error: any }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    if (Date.now() - startTime > opts.timeoutMs) {
      throw new Error(
        `retryQueryMany timeout after ${opts.timeoutMs}ms (${attempt} attempts)`
      );
    }

    const result = await queryFn();

    // Return if data found or error occurred
    if (result.data !== null || result.error !== null) {
      return result;
    }

    if (attempt < opts.maxRetries) {
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(1.5, attempt),
        opts.maxDelayMs
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return await queryFn();
}
