import { lazy, useState } from "react";
import { Loader2 } from "lucide-react";
import { Flower } from "@/components/icons";
import { Button } from "@/components/ui/button";

const ItemPresentationSettingsPopover = lazy(
  () => import("./ItemPresentationPopover")
);

export const ItemPresentationLoadingFallback = () => (
  <Button
    variant="outline"
    size="icon"
    className="h-9 w-9 shrink-0"
    aria-label="Loading item presentation settings"
    disabled
  >
    <Loader2 className="animate-spin" />
  </Button>
);

/**
 * Keeps item-presentation settings out of the list-screen chunk until opened.
 * While the chunk loads, Suspense shows {@link ItemPresentationLoadingFallback}
 * in place of the trigger so the control bar does not shift.
 */
const LazyItemPresentation = () => {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (!shouldLoad) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => setShouldLoad(true)}
        onMouseEnter={() => setShouldLoad(true)}
      >
        <Flower />
        <span className="sr-only">Card Presentation Settings</span>
      </Button>
    );
  }

  return <ItemPresentationSettingsPopover initiallyOpen />;
};

export default LazyItemPresentation;
