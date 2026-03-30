import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ReactNode } from "react";

export const BadgeWithPopover = ({ name, desc, icon }: { name: string, desc?: string, icon?: ReactNode }) => {
    const content = (
        <Badge variant="outline" className="px-4 m-1 cursor-not-allowed whitespace-nowrap">
            {icon && <span className="mr-1 opacity-70">{icon}</span>}
            {name}
        </Badge>
    );

    if (desc == null) {
        return content;
    }
    return <Popover>
        <PopoverTrigger asChild>
            <button>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#2effff] hover:text-black whitespace-nowrap m-1 t px-4">
                    {icon && <span className="mr-1 opacity-70">{icon}</span>}
                    {name}
                </Badge>
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 text-xs">
            {desc}
        </PopoverContent>
    </Popover>
}