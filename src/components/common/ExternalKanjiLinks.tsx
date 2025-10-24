import { externalLinks } from "@/lib/external-links";
import { ExternalTextLink } from "./ExternalTextLink";

export const ExternalKanjiLinks = ({ kanji }: { kanji: string }) => {
  return (
    <ul className="flex flex-wrap">
      {externalLinks.map((item) => {
        return (
          <li key={item.name} className="m-1">
            <ExternalTextLink href={`${item.url(kanji)}`} text={item.name} />
          </li>
        );
      })}
    </ul>
  );
};
