import { lazy, Suspense, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeaderDrawer = lazy(() => import("./HeaderDrawer"));

const MenuTriggerFallback = ({ disabled = false }: { disabled?: boolean }) => (
  <Button
    variant="outline"
    size="icon"
    className="w-8 h-8 rounded-xl"
    aria-label="Open menu"
    disabled={disabled}
  >
    <Menu className="w-7 h-7" />
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
        size="icon"
        className="w-8 h-8 rounded-xl"
        aria-label="Open menu"
        onClick={() => setShouldLoad(true)}
      >
        <Menu className="w-7 h-7" />
      </Button>
    );
  }

  return (
    <Suspense fallback={<MenuTriggerFallback disabled />}>
      <HeaderDrawer initiallyOpen />
    </Suspense>
  );
};

export default LazyHeaderDrawer;
