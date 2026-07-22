import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export const RefreshPageBtn = ({ cnOverride }: { cnOverride?: string }) => (
  <Button
    variant="outline"
    size="iconXl"
    onClick={() => window.location.reload()}
    aria-label="Refresh page"
  >
    <RefreshCw className={cn("w-[1.2rem] h-[1.2rem]", cnOverride)} />
  </Button>
);
