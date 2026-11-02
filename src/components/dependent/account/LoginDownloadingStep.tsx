import { Loader2 } from "lucide-react";

/**
 * Shown while `sync.catchUp()` runs after a successful login. A failure
 * closes the login dialog and opens "Couldn't download your data" instead.
 */
export const LoginDownloadingStep = () => (
  <p
    role="status"
    className="flex items-center justify-center gap-2 py-8 text-sm font-semibold"
  >
    <Loader2 aria-hidden className="size-5 animate-spin" />
    Downloading your data…
  </p>
);
