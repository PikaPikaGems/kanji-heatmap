import { InfoIcon } from "lucide-react";
import { GenericPopover } from "./GenericPopover";
import { ExternalTextLink } from "./ExternalTextLink";

type SourceLink = { text: string; url: string };

export const PrimaryDataSources = ({
  links,
  title = "View Primary Data Sources"
}: {
  links: SourceLink[];
  title?: string;
}) => (
  <div className="pl-2 my-6 text-left ">
    <GenericPopover
      trigger={
        <span className="inline-flex items-center gap-1 leading-loose underline cursor-pointer decoration-dotted underline-offset-8">
          <strong>{title}</strong>
          <InfoIcon size={14} />
        </span>
      }
      content={
        <div className="p-4 text-xs text-left min-w-32 max-w-64">
          <ul className="space-y-1 list-disc list-inside">
            {links.map((link) => (
              <li key={link.url}>
                <ExternalTextLink
                  href={link.url}
                  text={link.text}
                  className="whitespace-normal"
                />
              </li>
            ))}
          </ul>
        </div>
      }
    />
  </div>

);
