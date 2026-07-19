import { Loader2 } from "lucide-react";

/** Full-page route loading state — vertically centered in the viewport. */
export const PageLoadingFallback = () => (
  <div
    className="flex flex-1 items-center justify-center w-full min-h-dvh"
    role="status"
    aria-label="Loading"
  >
    <Loader2 className="size-7 animate-spin" />
  </div>
);
