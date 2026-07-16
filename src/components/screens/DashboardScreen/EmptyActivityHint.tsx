import { Link } from "@/components/dependent/routing";
import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/components/items/practice-pages";

const practiceLinks = [
  { href: speedKatakanaPageMeta.href, label: "Speed Katakana" },
  { href: productionPracticePageMeta.href, label: "Production" },
  { href: recognitionPracticePageMeta.href, label: "Recognition" },
] as const;

export const EmptyActivityHint = ({
  title = "Nothing here yet",
  body = "Finish a practice round and your stats will show up on this device.",
}: {
  title?: string;
  body?: string;
}) => (
  <div className="mt-5 rounded-2xl border-2 border-dashed border-foreground/20 bg-muted/20 px-4 py-6 text-center">
    <p className="text-base font-extrabold">{title}</p>
    <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
      {body}
    </p>
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {practiceLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex h-10 items-center rounded-2xl border-2 border-b-4 border-foreground/25 bg-background px-4 text-sm font-bold transition-[transform,border-width] active:translate-y-[2px] active:border-b-2 hover:bg-accent"
        >
          {item.label}
        </Link>
      ))}
    </div>
  </div>
);
