import { Loader2 } from "lucide-react";

export const MasteryLoading = () => (
  <div
    className="flex items-center justify-center w-full h-full"
    role="status"
    aria-label="Loading"
  >
    <Loader2 className="size-7 animate-spin" />
  </div>
);
