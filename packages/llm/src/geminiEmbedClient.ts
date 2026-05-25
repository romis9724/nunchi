/**
 * geminiEmbedClient — Gemini text-embedding-004 HTTP client
 *
 * Calls Google Generative Language API to generate 768-dim embeddings.
 * Always throws on failure; callers needing graceful degradation wrap in try/catch.
 *
 * Constraint: 임베딩 차원 768 (text-embedding-004 기본값과 일치)
 * Constraint: GEMINI_API_KEY 환경변수 사용 — service_role 키 클라이언트 노출 금지
 *
 * Design: mirrors ollamaEmbedClient shape so generateEmbedding() can swap providers.
 */

export interface GeminiEmbedOptions {
  /** Gemini API key (default: GEMINI_API_KEY env) */
  apiKey?: string;
  /** Model name (default: text-embedding-004) */
  model?: string;
  /** Expected embedding dimension; throws if actual ≠ expected (default: 768) */
  expectedDim?: number;
  /** Request timeout in ms (default: 15 000) */
  timeoutMs?: number;
}

const GEMINI_EMBED_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Call Gemini embedContent API and return the 768-dim embedding vector.
 *
 * Throws:
 *  - `GeminiConfigError`   when GEMINI_API_KEY is absent
 *  - `GeminiNetworkError`  on fetch-level failure (connection refused, timeout, DNS)
 *  - `GeminiHttpError`     on HTTP error status (4xx / 5xx)
 *  - `GeminiFormatError`   when the response body lacks the `embedding.values` array
 *  - `GeminiDimError`      when the embedding length ≠ expectedDim
 */
export async function geminiEmbed(
  text: string,
  options: GeminiEmbedOptions = {}
): Promise<number[]> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model = options.model ?? "text-embedding-004";
  const expectedDim = options.expectedDim ?? 768;
  const timeoutMs = options.timeoutMs ?? 15_000;

  // ── 0. Config validation ──────────────────────────────────────────────────────
  if (!apiKey) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is required for Gemini embedding"
    );
  }

  // ── 1. Network call ───────────────────────────────────────────────────────────
  const url = `${GEMINI_EMBED_BASE_URL}/${model}:embedContent?key=${apiKey}`;
  const requestBody = {
    model: `models/${model}`,
    content: {
      parts: [{ text }],
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new GeminiNetworkError(
      `Gemini network error: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  // ── 2. HTTP status ────────────────────────────────────────────────────────────
  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable body)");
    throw new GeminiHttpError(
      `Gemini HTTP error: ${res.status} ${errText}`,
      res.status
    );
  }

  // ── 3. JSON parsing ───────────────────────────────────────────────────────────
  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    throw new GeminiFormatError(
      `Gemini response JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  // ── 4. Shape validation ───────────────────────────────────────────────────────
  // Gemini response: { "embedding": { "values": [...] } }
  const embedding = (data as Record<string, unknown>)?.embedding;
  if (
    embedding == null ||
    typeof embedding !== "object" ||
    !Array.isArray((embedding as Record<string, unknown>).values)
  ) {
    throw new GeminiFormatError(
      `Gemini response missing 'embedding.values' array. Got: ${JSON.stringify(data)}`
    );
  }

  const values = (embedding as { values: unknown[] }).values;

  // ── 5. Dimension check ────────────────────────────────────────────────────────
  if (values.length !== expectedDim) {
    throw new GeminiDimError(
      `Gemini embedding dimension mismatch: expected ${expectedDim}, got ${values.length}`,
      values.length,
      expectedDim
    );
  }

  return values as number[];
}

// ── Typed error classes ────────────────────────────────────────────────────────

/** Thrown when required configuration (GEMINI_API_KEY) is missing */
export class GeminiConfigError extends Error {
  override readonly name = "GeminiConfigError";
  constructor(message: string) {
    super(message);
  }
}

/** Thrown when the fetch() call itself fails (network unreachable, timeout, DNS) */
export class GeminiNetworkError extends Error {
  override readonly name = "GeminiNetworkError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/** Thrown when Gemini returns a non-2xx HTTP status */
export class GeminiHttpError extends Error {
  override readonly name = "GeminiHttpError";
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Thrown when the response body is malformed or missing embedding.values */
export class GeminiFormatError extends Error {
  override readonly name = "GeminiFormatError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/** Thrown when the embedding vector has an unexpected number of dimensions */
export class GeminiDimError extends Error {
  override readonly name = "GeminiDimError";
  readonly actualDim: number;
  readonly expectedDim: number;
  constructor(message: string, actualDim: number, expectedDim: number) {
    super(message);
    this.actualDim = actualDim;
    this.expectedDim = expectedDim;
  }
}
