import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { GenericPopover } from "./GenericPopover";

export const BadgeWithPopover = ({
  name,
  desc,
  icon,
}: {
  name: string;
  desc?: string;
  icon?: ReactNode;
}) => {
  if (desc == null) {
    return (
      <Badge
        variant="outline"
        className="px-4 m-1 cursor-not-allowed whitespace-nowrap"
      >
        {icon && <span className="mr-1 opacity-70">{icon}</span>}
        {name}
      </Badge>
    );
  }

  return (
    <GenericPopover
      showArrow={false}
      contentClassName="w-64 text-xs"
      trigger={
        <button>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-[#2effff] hover:text-black whitespace-nowrap m-1 t px-4"
          >
            {icon && <span className="mr-1 opacity-70">{icon}</span>}
            {name}
          </Badge>
        </button>
      }
      content={desc}
    />
  );
};
