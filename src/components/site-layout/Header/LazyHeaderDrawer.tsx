import { lazy, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeaderDrawer = lazy(() => import("./HeaderDrawer"));

export const HeaderDrawerLoadingFallback = () => (
  <Button
    variant="outline"
    size="iconXl"
    aria-label="Loading navigation menu"
    disabled
  >
    <Loader2 className="w-7 h-7 animate-spin" />
  </Button>
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
