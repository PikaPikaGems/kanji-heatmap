import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const RefreshPageBtn = () => (
    <Button variant="outline" size="iconXl" onClick={() => window.location.reload()} aria-label="Refresh page">
        <RefreshCw className="w-[1.2rem] h-[1.2rem]" />
    </Button>
);