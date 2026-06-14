import { externalLinks } from "@/lib/external-links";

export const ExternalKanjiLinks = ({ kanji }: { kanji: string }) => {
  return (
    <ul className="flex flex-wrap">
      {externalLinks.map((item) => {
        return (
          <li key={item.name} className="px-1 py-1">
            <a href={`${item.url(kanji)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1 text-sm transition-colors border border-dotted rounded-full hover:bg-accent hover:text-accent-foreground"
            > {item.name}</a>
          </li>
        );
      })}
    </ul>
  );
};
