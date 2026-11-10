import { providerLabel } from "./providers/capabilities";
import type { AiProvider } from "./providers/types";

/**
 * User-facing copy for a failed AI request. `fetch()` rejects with a
 * TypeError ("Failed to fetch") when the request never got a response: no
 * connection, or a provider that blocks this browser request.
 */
export const describeAiError = (
  error: unknown,
  fallback: string,
  provider?: AiProvider
): string => {
  if (error instanceof TypeError) {
    return `Couldn't reach ${provider ? providerLabel(provider) : "the AI provider"}. Check your connection and try again.`;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
