import { CircleArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/components/dependent/routing/router-hooks";
import { useEnterAction } from "@/hooks/use-enter-action";
import { getPracticeReturnHref } from "@/lib/practice-return-path";

/** Back/exit control for in-progress practice games. Escape also ends. */
export const EndSession = ({ onClick }: { onClick: () => void }) => {
  useEnterAction(onClick, true, ["Escape"]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute z-10 top-1 left-1 text-foreground opacity-70 hover:opacity-100 hover:bg-opacity-0"
      tabIndex={-1}
      onClick={onClick}
      aria-label="End session"
    >
      <CircleArrowLeft />
    </Button>
  );
};

/** Leave a practice start screen to the last non-practice route via wouter. */
export const LeavePractice = () => {
  const [, setLocation] = useLocation();
  return (
    <EndSession
      onClick={() => setLocation(getPracticeReturnHref(), { replace: true })}
    />
  );
};
