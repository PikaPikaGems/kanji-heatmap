import { InfoIcon } from "lucide-react";
import { GenericPopover } from "./GenericPopover";
import { ExternalTextLink } from "./ExternalTextLink";

type SourceLink = { text: string; url: string };

export const PrimaryDataSources = ({
  links,
  note,
}: {
  links: SourceLink[];
  note?: string;
}) => (
  <div className="py-4 pl-2 text-left">
    {note && <p className="mb-3 text-sm">{note}</p>}
    <GenericPopover
      trigger={
        <span className="inline-flex items-center gap-1 leading-loose underline cursor-pointer decoration-dotted underline-offset-8">
          <strong>View Primary Data Sources</strong>
          <InfoIcon size={14} />
        </span>
      }
      content={
        <div className="p-4 text-xs text-left w-96 ">
          <ul className="space-y-1 list-disc list-inside">
            {links.map((link) => (
              <li key={link.url}>
                <ExternalTextLink href={link.url} text={link.text} />
              </li>
            ))}
          </ul>
        </div>
      }
    />
  </div>
);
