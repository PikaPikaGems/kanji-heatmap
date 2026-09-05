import { Wifi, WifiOff, Info } from "lucide-react";
import { Copy, CheckCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  formatDebugInfoForClipboard,
  useDebugInfo,
  type DebugInfoSnapshot,
} from "@/hooks/use-debug-info";

const NetworkStatus = ({
  online,
  effectiveType,
  saveData,
}: Pick<DebugInfoSnapshot, "online" | "effectiveType" | "saveData">) => (
  <div className="flex items-center gap-1.5">
    {online ? (
      <Wifi className="text-green-500 size-3" aria-label="Online" />
    ) : (
      <WifiOff className="size-3 text-muted-foreground" aria-label="Offline" />
    )}
    <span className={online ? "text-green-500" : "text-muted-foreground"}>
      {online ? "online" : "offline"}
    </span>
    {effectiveType && <span>{effectiveType}</span>}
    {saveData && <>{"🐌"}</>}
  </div>
);

const DeviceSpecs = ({ device }: { device: DebugInfoSnapshot["device"] }) => {
  if (!device) return null;
  const { browser, os, platform } = device;
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

const CopyDebugButton = ({ info }: { info: DebugInfoSnapshot }) => {
  const { copy, status } = useCopyToClipboard();
  const copied = status === "copied";

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center transition-colors rounded-md size-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={copied ? "Copied" : "Copy to clipboard"}
      aria-label={copied ? "Copied debug info" : "Copy debug info"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void copy(formatDebugInfoForClipboard(info), e);
      }}
    >
      {copied ? (
        <CheckCircle className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
};

export const DebugInfo = () => {
  const info = useDebugInfo();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="iconXl"
          className="mb-2 mr-1"
          aria-label="Debug info"
        >
          <Info className="w-[1.2rem] h-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-3 mr-2 w-52" side="top" align="start">
        <div className="space-y-1 font-mono text-[8px]">
          <div className="flex items-center justify-between pb-1 mb-3 border-b border-dotted">
            <span className="text-[10px] uppercase font-medium tracking-wide text-muted-foreground">
              Debug
            </span>
            <CopyDebugButton info={info} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Network</span>
            <NetworkStatus
              online={info.online}
              effectiveType={info.effectiveType}
              saveData={info.saveData}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>v{info.version}</span>
          </div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-muted-foreground">Viewport</span>
            <span>
              {info.viewportWidth}×{info.viewportHeight}
            </span>
          </div>
          <div className="pt-2 border-t border-dotted">
            <DeviceSpecs device={info.device} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
