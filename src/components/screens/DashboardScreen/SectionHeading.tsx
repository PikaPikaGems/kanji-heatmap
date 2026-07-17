import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";

export const SectionHeading = ({
  title,
  description,
  className,
}: {
  title: string;
  description: ReactNode;
  className?: string;
}) => (
  <div className={cn("mb-5 text-center border-b-2 border-dotted", className)}>
    <h2 className="inline-flex items-center justify-center gap-1.5 mb-2 uppercase text-sm font-extrabold text-muted-foreground">
      <GenericPopover
        trigger={
          <button
            type="button"
            className="inline-flex text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground"
            aria-label={`About ${title}`}
          >
            {title}
            <InfoIcon className="inline-block ml-2" size={14} />
          </button>
        }
        content={
          <div className="max-w-xs px-4 py-3 text-sm text-left text-muted-foreground">
            {description}
          </div>
        }
      />
    </h2>
  </div>
);
