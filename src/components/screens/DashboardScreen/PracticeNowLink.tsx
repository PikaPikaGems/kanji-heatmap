import { Link } from "@/components/dependent/routing";

/**
 * A heatmap cell's way into that batch or challenge: the low-key dotted
 * underline text action (TextActionButton's look), as a link because it
 * navigates.
 */
export const PracticeNowLink = ({ to }: { to: string }) => (
  <Link
    to={to}
    className="flex items-center justify-center w-full gap-1 px-1 text-xs leading-loose underline rounded-lg text-foreground decoration-dotted underline-offset-4 hover:bg-neon-accent hover:text-black"
  >
    <strong>Practice Now</strong>
  </Link>
);
