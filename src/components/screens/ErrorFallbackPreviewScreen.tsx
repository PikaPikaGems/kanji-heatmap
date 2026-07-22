import { errorFallbackAlternatives } from "@/components/error/ErrorFallbackAlternatives";
import { NoSearchResults } from "@/components/error/NoSearchResults";
import { PageNotFound } from "@/components/error/PageNotFound";
import { BottomBar } from "@/components/common/BottomBar";

const relatedStates = [
  {
    id: "page-not-found",
    label: "PageNotFound",
    description: "Unknown route / 404.",
    node: <PageNotFound />,
  },
  {
    id: "no-search-results",
    label: "NoSearchResults",
    description: "Empty kanji search / filters.",
    node: <NoSearchResults />,
  },
] as const;

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
          Toolbar is the current default. Linked hi / bug / refresh sit above
          the icon row.
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

      <header className="mb-6 mt-12 space-y-2 text-center">
        <h2 className="text-lg font-semibold tracking-tight">
          Related empty / not-found states
        </h2>
        <p className="text-sm text-muted-foreground">
          Same toolbar CTA treatment for consistency.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {relatedStates.map(({ id, label, description, node }) => (
          <section
            key={id}
            id={id}
            className="overflow-hidden rounded-2xl border border-border/60"
          >
            <div className="space-y-1 border-b border-border/60 px-4 py-3 text-left">
              <h3 className="text-sm font-semibold">{label}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="min-h-80 bg-background">{node}</div>
          </section>
        ))}
      </div>

      <BottomBar justify="center" />
    </div>
  );
};
