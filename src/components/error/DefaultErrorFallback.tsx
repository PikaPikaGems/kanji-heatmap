import { ErrorToolbarCta, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";

/**
 * Default full-page unexpected-error fallback.
 * Apology + message, then linked hi/bug/refresh above the social icon row.
 */
export const DefaultErrorFallback = ({
  message = "Welp... this isn’t supposed to happen! 🫣🫣",
  showDefaultCta = true,
}: {
  message?: string;
  showDefaultCta?: boolean;
}) => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col items-center gap-6 animate-fade-in">
        <Sumimasen />
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        {showDefaultCta && <ErrorToolbarCta />}
      </div>
    </Wrapper>
  );
};
