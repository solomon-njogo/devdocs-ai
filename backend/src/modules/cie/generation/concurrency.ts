/**
 * Run a set of async workers with a bounded concurrency limit.
 *
 * Preserves result order aligned to `items`. Individual worker errors are
 * captured in the returned array so one failure does not sink the batch.
 */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<Array<{ ok: true; value: R } | { ok: false; error: unknown }>> {
  const concurrency = Math.max(1, Math.floor(limit));
  const results: Array<{ ok: true; value: R } | { ok: false; error: unknown }> = new Array(items.length);
  let next = 0;

  async function runOne(): Promise<void> {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      try {
        const value = await worker(items[idx], idx);
        results[idx] = { ok: true, value };
      } catch (error) {
        results[idx] = { ok: false, error };
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(pool);
  return results;
}
