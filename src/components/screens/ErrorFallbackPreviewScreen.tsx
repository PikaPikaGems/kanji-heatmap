import { errorFallbackAlternatives } from "@/components/error/ErrorFallbackAlternatives";
import { BottomBar } from "@/components/common/BottomBar";

/**
 * Temporary gallery for picking a default error-boundary fallback.
 * Visit `/error-fallback-preview` — not linked from nav.
 */
export const ErrorFallbackPreviewScreen = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-20">
      <header className="mb-8 space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Error fallback alternatives
        </h1>
        <p className="text-sm text-muted-foreground">
          Soft is wired as the current default. Compare spacing and icon CTAs
          below, then we can lock one in.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {errorFallbackAlternatives.map(
          ({ id, label, description, Component }) => (
            <section
              key={id}
              className="overflow-hidden rounded-2xl border border-border/60"
            >
              <div className="space-y-1 border-b border-border/60 px-4 py-3 text-left">
                <h2 className="text-sm font-semibold">{label}</h2>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="min-h-72 bg-background">
                <Component />
              </div>
            </section>
          )
        )}
      </div>

      <BottomBar justify="center" />
    </div>
  );
};
