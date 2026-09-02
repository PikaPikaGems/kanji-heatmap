import { Flower, Settings2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { forceHardRefresh } from "@/lib/force-hard-refresh";
import { SearchInputErrorFallback } from "./SearchInput/SearchInputErrorFallback";

export const ControlBarErrorFallback = () => (
  <>
    <SearchInputErrorFallback />
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0 text-muted-foreground opacity-80 transition-opacity hover:opacity-100"
      onClick={() => void forceHardRefresh()}
      aria-label="Controls failed to load. Refresh page."
    >
      <Settings2 />
    </Button>
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0 text-muted-foreground opacity-80 transition-opacity hover:opacity-100"
      onClick={() => void forceHardRefresh()}
      aria-label="Controls failed to load. Refresh page."
    >
      <Flower />
      <span className="sr-only">Card Presentation Settings</span>
    </Button>
  </>
);
