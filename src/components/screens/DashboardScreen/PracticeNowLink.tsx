import { Link } from "@/components/dependent/routing";
import { practiceButtonVariants } from "@/components/ui/practice-button-variants";
import { cn } from "@/lib/utils";

/**
 * A heatmap cell's way into that batch or challenge: a primary
 * PracticeButton, as a link because it navigates.
 */
export const PracticeNowLink = ({ to }: { to: string }) => (
  <Link
    to={to}
    className={cn(practiceButtonVariants({ size: "md" }), "h-10 text-sm")}
  >
    Practice Now
  </Link>
);
