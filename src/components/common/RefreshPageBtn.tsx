import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const RefreshPageBtn = () => (
    <Button variant="outline" size="icon" className="w-8 h-8 rounded-xl" onClick={() => window.location.reload()} aria-label="Refresh page">
        <RefreshCw className="w-[1.2rem] h-[1.2rem]" />
    </Button>
);