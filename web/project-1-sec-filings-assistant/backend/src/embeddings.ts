// Voyage AI's embeddings API — plain fetch, same pattern as the SEC EDGAR
// tool. `input_type` tells the model whether text is something being stored
// ("document") or something being searched for ("query") — Voyage optimizes
// the embedding slightly differently for each, so it matters that ingestion
// and search each pass the right one.
const MAX_RETRIES = 5;

// Voyage's "no payment method on file" tier allows 3 requests/minute — pace
// requests to that limit up front instead of firing bursts and hoping
// retries catch up. Once a payment method is added this can be lowered
// (or removed) via the env var; defaults to the safe/slow value.
const MIN_REQUEST_INTERVAL_MS = Number(process.env.VOYAGE_MIN_REQUEST_INTERVAL_MS ?? 21000);
let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRateLimitWindow(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

export async function embedTexts(
  texts: string[],
  inputType: "document" | "query"
): Promise<number[][]> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForRateLimitWindow();

    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: "voyage-3",
        input_type: inputType,
      }),
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      // Rate-limited — honor Retry-After if Voyage sends it, otherwise back off
      // exponentially (2s, 4s, 8s, ...).
      const retryAfterHeader = response.headers.get("Retry-After");
      const waitMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 2 ** attempt * 1000;
      console.log(`  rate-limited, waiting ${waitMs}ms before retry (attempt ${attempt + 1})...`);
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Voyage API request failed: ${response.status} ${response.statusText} — ${body}`);
    }

    const data = await response.json();
    return data.data.map((entry: { embedding: number[] }) => entry.embedding);
  }

  throw new Error("Voyage API request failed after max retries");
}
