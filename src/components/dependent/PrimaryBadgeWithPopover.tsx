import { Badge } from "@/components/ui/badge";
import { GenericPopover } from "@/components/common/GenericPopover";

export const PrimaryBadgeWithPopover = ({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) => (
  <GenericPopover
    contentClassName="text-sm"
    trigger={
      <button>
        <Badge className="m-1 cursor-pointer">
          {label} {value}
        </Badge>
      </button>
    }
    content={
      <p>
        <span className="font-semibold">{label}:</span> {description}
      </p>
    }
  />
);
