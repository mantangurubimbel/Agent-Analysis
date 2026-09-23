export const LLM_PROVIDERS = ["groq", "openrouter", "gemini"] as const;
export const DEFAULT_LLM_FALLBACK_ORDER = [...LLM_PROVIDERS];
const LEGACY_LLM_FALLBACK_ORDER = ["groq", "gemini", "openrouter"];

export function normalizeLlmFallbackOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_LLM_FALLBACK_ORDER];

  const allowedProviders = new Set<string>(DEFAULT_LLM_FALLBACK_ORDER);
  const order = [
    ...new Set(
      value
        .map(String)
        .filter((provider) => allowedProviders.has(provider))
    ),
  ];
  if (JSON.stringify(order) === JSON.stringify(LEGACY_LLM_FALLBACK_ORDER)) {
    return [...DEFAULT_LLM_FALLBACK_ORDER];
  }
  return [
    ...order,
    ...DEFAULT_LLM_FALLBACK_ORDER.filter((provider) => !order.includes(provider)),
  ];
}
