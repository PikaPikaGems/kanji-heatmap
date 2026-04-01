import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCardArrow,
} from "@/components/ui/popover";

export const PrimaryBadgeWithPopover = ({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) => (
  <Popover>
    <PopoverTrigger>
      <Badge className="m-1 cursor-pointer">
        {label} {value}
      </Badge>
    </PopoverTrigger>
    <PopoverContent className="text-sm">
      <PopoverCardArrow />
      <p>
        <span className="font-semibold">{label}:</span> {description}
      </p>
    </PopoverContent>
  </Popover>
);
