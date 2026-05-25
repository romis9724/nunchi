/**
 * ollamaEmbedClient — raw Ollama embedding HTTP client
 *
 * This module is the narrow HTTP adapter for Ollama's /api/embeddings endpoint.
 * It always throws on failure (network error, HTTP error, format mismatch,
 * dimension mismatch). Callers that need graceful degradation must wrap it in
 * their own try/catch.
 *
 * Design principle: separate the "call Ollama" concern from the "fallback"
 * concern so each can be unit-tested independently.
 */

export interface OllamaEmbedOptions {
  /** Base URL of the Ollama server (default: OLLAMA_BASE_URL env or http://localhost:11434) */
  baseUrl?: string;
  /** Model name (default: OLLAMA_EMBED_MODEL env or nomic-embed-text:latest) */
  model?: string;
  /** Expected embedding dimension; throws if actual ≠ expected (default: 768) */
  expectedDim?: number;
  /** Request timeout in ms (default: 10 000) */
  timeoutMs?: number;
}

/**
 * Call Ollama /api/embeddings and return the embedding vector.
 *
 * Throws:
 *  - `OllamaNetworkError` on fetch-level failure (connection refused, timeout, DNS)
 *  - `OllamaHttpError`    on HTTP error status (4xx / 5xx)
 *  - `OllamaFormatError`  when the response body lacks an `embedding` array
 *  - `OllamaDimError`     when the embedding length ≠ expectedDim
 */
export async function ollamaEmbed(
  text: string,
  options: OllamaEmbedOptions = {}
): Promise<number[]> {
  const baseUrl =
    options.baseUrl ??
    process.env.OLLAMA_BASE_URL ??
    "http://localhost:11434";
  const model =
    options.model ??
    process.env.OLLAMA_EMBED_MODEL ??
    "nomic-embed-text:latest";
  const expectedDim = options.expectedDim ?? 768;
  const timeoutMs = options.timeoutMs ?? 10_000;

  // ── 1. Network call ─────────────────────────────────────────────────────────
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new OllamaNetworkError(
      `Ollama network error: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  // ── 2. HTTP status ──────────────────────────────────────────────────────────
  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable body)");
    throw new OllamaHttpError(
      `Ollama HTTP error: ${res.status} ${errText}`,
      res.status
    );
  }

  // ── 3. JSON parsing ─────────────────────────────────────────────────────────
  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    throw new OllamaFormatError(
      `Ollama response JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  // ── 4. Shape validation ─────────────────────────────────────────────────────
  if (
    data == null ||
    typeof data !== "object" ||
    !Array.isArray((data as Record<string, unknown>).embedding)
  ) {
    throw new OllamaFormatError(
      `Ollama response missing 'embedding' array. Got: ${JSON.stringify(data)}`
    );
  }

  const embedding = (data as { embedding: unknown[] }).embedding;

  // ── 5. Dimension check ──────────────────────────────────────────────────────
  if (embedding.length !== expectedDim) {
    throw new OllamaDimError(
      `Ollama embedding dimension mismatch: expected ${expectedDim}, got ${embedding.length}`,
      embedding.length,
      expectedDim
    );
  }

  return embedding as number[];
}

// ── Typed error classes ───────────────────────────────────────────────────────

/** Thrown when the fetch() call itself fails (network unreachable, timeout, DNS) */
export class OllamaNetworkError extends Error {
  override readonly name = "OllamaNetworkError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/** Thrown when Ollama returns a non-2xx HTTP status */
export class OllamaHttpError extends Error {
  override readonly name = "OllamaHttpError";
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Thrown when the response body is malformed or missing the embedding field */
export class OllamaFormatError extends Error {
  override readonly name = "OllamaFormatError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/** Thrown when the embedding vector has an unexpected number of dimensions */
export class OllamaDimError extends Error {
  override readonly name = "OllamaDimError";
  readonly actualDim: number;
  readonly expectedDim: number;
  constructor(message: string, actualDim: number, expectedDim: number) {
    super(message);
    this.actualDim = actualDim;
    this.expectedDim = expectedDim;
  }
}
