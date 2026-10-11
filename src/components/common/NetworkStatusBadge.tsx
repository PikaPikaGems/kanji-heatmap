import { useNetworkState } from "@/hooks/use-network-state";
import { cn } from "@/lib/utils";

/** "● Online" / "● Offline" pill: green dot online, gray dot offline. */
export const NetworkStatusBadge = () => {
  const { online } = useNetworkState();

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          online ? "bg-green-500" : "bg-muted-foreground"
        )}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
};
