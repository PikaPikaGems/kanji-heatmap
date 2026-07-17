import { lazy, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeaderDrawer = lazy(() => import("./HeaderDrawer"));

export const HeaderDrawerLoadingFallback = () => (
  <>
    <div className="fixed inset-0 z-50 bg-black/80" aria-hidden="true" />
    <aside
      className="fixed top-0 bottom-0 right-0 z-50 flex w-72 flex-col border-l-4 border-dashed bg-background p-4 shadow-lg sm:w-80"
      role="status"
      aria-label="Loading navigation menu"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="w-32 h-5 rounded bg-muted animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-11 border-2 border-dashed rounded-xl bg-muted/40 animate-pulse"
          />
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="w-16 h-4 rounded bg-muted animate-pulse"
          />
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="w-10 h-10 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>

      <span className="mt-auto text-xs text-center text-muted-foreground">
        Loading menu...
      </span>
    </aside>
  </>
);

/**
 * Keeps vaul + nav drawer out of the app entry chunk until the menu is opened.
 */
const LazyHeaderDrawer = () => {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (!shouldLoad) {
    return (
      <Button
        variant="outline"
        size="iconXl"
        aria-label="Open menu"
        onClick={() => setShouldLoad(true)}
      >
        <Menu className="w-7 h-7" />
      </Button>
    );
  }

  return <HeaderDrawer initiallyOpen />;
};

export default LazyHeaderDrawer;
