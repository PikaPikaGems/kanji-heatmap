import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { ErrorSocialIcons, RefreshOrGoBackHome, Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";

const DEFAULT_MESSAGE = "Welp... this isn’t supposed to happen! 🫣🫣";

type FallbackProps = {
  message?: string;
  showDefaultCta?: boolean;
};

/**
 * Alternative A — soft copy + icon row (current default direction).
 * Apology first, muted supporting line, then the usual social icons.
 */
export const ErrorFallbackSoft = ({
  message = DEFAULT_MESSAGE,
  showDefaultCta = true,
}: FallbackProps) => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col items-center gap-5 animate-fade-in">
        <Sumimasen />
        <p className="text-sm font-medium leading-relaxed text-foreground/90">
          {message}
        </p>
        {showDefaultCta && (
          <div className="flex w-full flex-col items-center gap-4">
            <ErrorSocialIcons />
            <RefreshOrGoBackHome />
          </div>
        )}
      </div>
    </Wrapper>
  );
};

/**
 * Alternative B — toolbar row.
 * Puts social icons beside the refresh control, like the bottom bar.
 */
export const ErrorFallbackToolbar = ({
  message = DEFAULT_MESSAGE,
  showDefaultCta = true,
}: FallbackProps) => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col items-center gap-6 animate-fade-in">
        <Sumimasen />
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        {showDefaultCta && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-1">
              <ErrorSocialIcons />
              <RefreshPageBtn />
            </div>
            <p className="text-xs text-muted-foreground">
              Say hi, report a bug, or refresh.
            </p>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

/**
 * Alternative C — compact inline apology.
 * すみません and bows on one line; tighter vertical rhythm.
 */
export const ErrorFallbackCompact = ({
  message = DEFAULT_MESSAGE,
  showDefaultCta = true,
}: FallbackProps) => {
  return (
    <Wrapper className="py-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-4 animate-fade-in">
        <Sumimasen layout="inline" />
        <p className="text-xs font-semibold leading-relaxed">{message}</p>
        {showDefaultCta && (
          <div className="flex w-full flex-col items-center gap-3">
            <ErrorSocialIcons />
            <RefreshOrGoBackHome />
          </div>
        )}
      </div>
    </Wrapper>
  );
};

/**
 * Alternative D — quiet / minimal.
 * Less emoji energy in the body copy; social icons carry the CTA.
 */
export const ErrorFallbackQuiet = ({
  message = "Something went wrong on our side.",
  showDefaultCta = true,
}: FallbackProps) => {
  return (
    <Wrapper>
      <div className="flex w-full max-w-sm flex-col items-center gap-6 animate-fade-in">
        <Sumimasen />
        <div className="space-y-1">
          <p className="text-base font-medium tracking-tight">{message}</p>
          <p className="text-xs text-muted-foreground">
            If it keeps happening, ping us.
          </p>
        </div>
        {showDefaultCta && <ErrorSocialIcons />}
      </div>
    </Wrapper>
  );
};

export const errorFallbackAlternatives = [
  {
    id: "soft",
    label: "Soft (default)",
    description:
      "Stacked apology, medium message, icon row, then refresh copy.",
    Component: ErrorFallbackSoft,
  },
  {
    id: "toolbar",
    label: "Toolbar",
    description: "Social icons + refresh button in one control row.",
    Component: ErrorFallbackToolbar,
  },
  {
    id: "compact",
    label: "Compact",
    description: "Inline すみません + bows, tighter spacing.",
    Component: ErrorFallbackCompact,
  },
  {
    id: "quiet",
    label: "Quiet",
    description: "Calmer copy; icons only for the CTA.",
    Component: ErrorFallbackQuiet,
  },
] as const;
