/**
 * User-facing copy for a failed xAI request. `fetch()` rejects with a
 * TypeError ("Failed to fetch") when the request never got a response.
 */
export const describeAiError = (error: unknown, fallback: string): string => {
  if (error instanceof TypeError) {
    return "Couldn't reach xAI. Check your connection and try again.";
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
