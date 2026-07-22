import { cn } from "@/lib/utils";

export const LOCAL_STORAGE_WARNING = "⚠️ Local storage only. Data may be lost.";

export const LocalStorageWarning = ({ className }: { className?: string }) => {
  return (
    <p className={cn("mx-auto text-xs text-muted-foreground", className)}>
      {LOCAL_STORAGE_WARNING}
    </p>
  );
};
