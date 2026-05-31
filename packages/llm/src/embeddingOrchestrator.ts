/**
 * embeddingOrchestrator — Ollama → Gemini fallback embedding pipeline
 *
 * Design principle: clients are injected as function arguments so each
 * dependency can be mocked independently in unit tests (Sub-AC 2c).
 *
 * Flow:
 *  1. Call ollamaFn(text)
 *  2. On any error (network or malformed response) → call geminiFn(text)
 *  3. Return whichever succeeds first
 *  4. If both fail, the second error propagates to the caller
 *
 * Callers that need graceful degradation (e.g. review-engine) should wrap
 * orchestrateEmbedding in their own try/catch and return [] on failure.
 */

/** Signature shared by both embedding clients */
export type EmbedFn = (text: string) => Promise<number[]>;

/**
 * Core orchestrator with injectable clients.
 *
 * @param text     - Source text to embed
 * @param ollamaFn - Ollama embedding client (injected; may throw)
 * @param geminiFn - Gemini embedding client (fallback; injected; may throw)
 * @returns 768-dim number[] from whichever provider succeeds first
 */
export async function orchestrateEmbedding(
  text: string,
  ollamaFn: EmbedFn,
  geminiFn: EmbedFn
): Promise<number[]> {
  try {
    return await ollamaFn(text);
  } catch {
    // Ollama failed (network error OR malformed/abnormal response)
    // → automatically switch to Gemini client
    return await geminiFn(text);
  }
}

/**
 * Production-ready wrapper that wires up the default Ollama and Gemini clients.
 *
 * Usage in review-engine or seed scripts:
 *   import { generateEmbeddingWithFallback } from "@noonchi/llm/embeddingOrchestrator";
 *
 * Throws if BOTH providers fail. Callers should catch and return [] for graceful
 * degradation so that semantic search failure does not block the review-engine.
 */
export async function generateEmbeddingWithFallback(
  text: string
): Promise<number[]> {
  const { ollamaEmbed } = await import("./ollamaEmbedClient");
  const { geminiEmbed } = await import("./geminiEmbedClient");
  return orchestrateEmbedding(text, ollamaEmbed, geminiEmbed);
}
