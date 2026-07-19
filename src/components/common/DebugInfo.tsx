import { Wifi, WifiOff, Info } from "lucide-react";
import { useWindowSize } from "@/hooks/use-window-size";
import { getUserAgentData } from "@/lib/ua-utils";
import { useNetworkState } from "@/hooks/use-network-state";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

declare const __BUILD_TIMESTAMP__: string;

const NetworkStatus = () => {
  const { online, effectiveType, saveData } = useNetworkState();

  return (
    <div className="flex items-center gap-1.5">
      {online ? (
        <Wifi className="text-green-500 size-3" aria-label="Online" />
      ) : (
        <WifiOff
          className="size-3 text-muted-foreground"
          aria-label="Offline"
        />
      )}
      <span className={online ? "text-green-500" : "text-muted-foreground"}>
        {online ? "online" : "offline"}
      </span>
      {effectiveType && <span>{effectiveType}</span>}
      {saveData && <>{"🐌"}</>}
    </div>
  );
};

const SwVersion = () => <span>v{__BUILD_TIMESTAMP__}</span>;

const WindowDims = () => {
  const [w, h] = useWindowSize(0);
  return (
    <span>
      {w}×{h}
    </span>
  );
};

const DeviceSpecs = () => {
  if (!navigator?.userAgent) return null;
  const { browser, os, platform } = getUserAgentData(navigator.userAgent);
  return (
    <div>
      <div>
        {os.name} · {os.version} · {platform.platform}
      </div>
      <div>
        {browser.name} · {browser.version}
      </div>
    </div>
  );
};

export const DebugInfo = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        size="iconXl"
        className="mr-1"
        aria-label="Debug info"
      >
        <Info className="w-[1.2rem] h-[1.2rem]" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-48 p-4 mr-2" side="top" align="start">
      <div className="space-y-1 font-mono text-[8px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Network</span>
          <NetworkStatus />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Version</span>
          <SwVersion />
        </div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-muted-foreground">Viewport</span>
          <WindowDims />
        </div>
        <div className="pt-2 border-t border-dotted ">
          <DeviceSpecs />
        </div>
      </div>
    </PopoverContent>
  </Popover>
);
