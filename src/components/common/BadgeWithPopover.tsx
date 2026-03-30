import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export const BadgeWithPopover = ({ name, desc }: { name: string, desc?: string }) => {
    if (desc == null) {
        return (
            <Badge variant="outline" className="cursor-not-allowed">
                {name}
            </Badge>
        )
    }
    return <Popover>
        <PopoverTrigger asChild>
            <button>
                <Badge variant="outline" className="cursor-pointer hover:bg-[#2effff] hover:text-black whitespace-nowrap m-1 px-2">
                    {name}
                </Badge>
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 text-xs">
            {desc}
        </PopoverContent>
    </Popover>
}