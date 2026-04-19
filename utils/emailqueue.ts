// utils/emailQueue.ts
export async function sendInBatches<T>(
    items: T[],
    sendFn: (item: T) => Promise<any>,
    batchSize = 2,
    delayMs = 1000
) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(sendFn));
        results.push(...batchResults);
        // Wait between batches to avoid rate limit
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return results;
}