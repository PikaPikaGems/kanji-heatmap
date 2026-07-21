import { ErrorFallbackSoft } from "./ErrorFallbackAlternatives";

/**
 * Default full-page unexpected-error fallback.
 * Sibling alternatives live in `ErrorFallbackAlternatives.tsx`
 * (preview at `/error-fallback-preview`).
 */
export const DefaultErrorFallback = ({
  message = "Welp... this isn’t supposed to happen! 🫣🫣",
  showDefaultCta = true,
}: {
  message?: string;
  showDefaultCta?: boolean;
}) => {
  return (
    <ErrorFallbackSoft message={message} showDefaultCta={showDefaultCta} />
  );
};
