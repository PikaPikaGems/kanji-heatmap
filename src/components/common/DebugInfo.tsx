import { useEffect, useState } from "react";
import { Wifi, WifiOff, Info } from "lucide-react";
import { getUserAgentData } from "@/lib/ua-utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

declare const __BUILD_TIMESTAMP__: string;

type NetworkInfo = { saveData?: boolean; effectiveType?: string };
type NavWithConnection = {
  connection?: NetworkInfo & {
    addEventListener?: (t: string, fn: () => void) => void;
    removeEventListener?: (t: string, fn: () => void) => void;
  }
};

const useNetworkState = (): NetworkInfo => {
  const conn = () => (navigator as unknown as NavWithConnection).connection;
  const [state, setState] = useState<NetworkInfo>(() => ({
    saveData: conn()?.saveData,
    effectiveType: conn()?.effectiveType,
  }));

  useEffect(() => {
    const c = conn();
    if (!c?.addEventListener) return;
    const update = () => setState({ saveData: c.saveData, effectiveType: c.effectiveType });
    c.addEventListener("change", update);
    return () => c.removeEventListener?.("change", update);
  }, []);

  return state;
};

const NetworkStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const network = useNetworkState();

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {online
        ? <Wifi className="text-green-500 size-3" aria-label="Online" />
        : <WifiOff className="size-3 text-muted-foreground" aria-label="Offline" />
      }
      <span className={online ? "text-green-500" : "text-muted-foreground"}>
        {online ? "online" : "offline"}
      </span>
      {network.effectiveType && (
        <span>
          {network.effectiveType}
        </span>
      )}
      {network.saveData && (
        <>{"🐌"}</>
      )}
    </div>
  );
};

const SwVersion = () => (
  <span>v{__BUILD_TIMESTAMP__}</span>
);

const WindowDims = () => {
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return <span>{dims.w}×{dims.h}</span>;
};

const DeviceSpecs = () => {
  if (!navigator?.userAgent) return null;
  const { browser, os, platform } = getUserAgentData(navigator.userAgent);
  return (
    <div>
      <div>{os.name} · {os.version} · {platform.platform}</div>
      <div>{browser.name} · {browser.version}</div>
    </div>
  );
};

export const DebugInfo = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="iconXl" className="mr-1" aria-label="Debug info">
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

  </Popover >
);
