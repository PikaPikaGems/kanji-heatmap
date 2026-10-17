import { Wifi, WifiOff, Info } from "lucide-react";
import { Copy, CheckCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEffect, type ReactNode } from "react";
import {
  useAiStorageUsage,
  type AiStorageUsageState,
} from "@/hooks/use-ai-storage-usage";
import { useAiVoiceState } from "@/hooks/use-ai-voice";
import { initAiVoice, type AiVoiceState } from "@/lib/ai-voice/engine";
import { AI_STORAGE_LIMITS } from "@/lib/ai-explain/storage-budgets";
import { StorageUsageBar } from "./StorageUsageBar";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  formatDebugInfoForClipboard,
  formatStorageForClipboard,
  useDebugInfo,
  voiceModelStatus,
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

/** A label and its value, one row of a two-column list. */
const DebugRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{children}</dd>
  </>
);

const DebugSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="space-y-3">
    <h3 className="text-sm font-semibold">{title}</h3>
    {children}
  </section>
);

const CopyDebugButton = ({ getText }: { getText: () => string }) => {
  const { copy, status } = useCopyToClipboard();
  const copied = status === "copied";

  return (
    <TextActionButton
      icon={
        copied ? (
          <CheckCircle className="size-3.5 text-green-500" />
        ) : (
          <Copy className="size-3.5" />
        )
      }
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void copy(getText(), e);
      }}
    >
      {copied ? "Copied" : "Copy debug info"}
    </TextActionButton>
  );
};

/** What this site keeps on the device, per kind, against our own limits. */
const StorageUsage = ({
  state,
  voice,
}: {
  state: AiStorageUsageState;
  voice: AiVoiceState;
}) => {
  if (state.status === "loading")
    return <p className="text-muted-foreground">Checking storage…</p>;
  if (state.status === "error")
    return <p className="text-destructive">Couldn&apos;t read storage.</p>;
  const { usage, estimate } = state;
  return (
    <div className="space-y-4">
      <StorageUsageBar
        label="Text"
        mine={usage.text.mine}
        others={usage.text.others}
        limit={AI_STORAGE_LIMITS.text}
        note="AI Explain answers, kanji essays, anchor word essays"
      />
      <StorageUsageBar
        label="MP3"
        mine={usage.audio.mine}
        others={usage.audio.others}
        limit={AI_STORAGE_LIMITS.audio}
        note="Essay and vocabulary narration"
      />
      <StorageUsageBar
        label="Images"
        mine={usage.images.mine}
        others={usage.images.others}
        limit={AI_STORAGE_LIMITS.images}
        note="Visual Mnemonics"
      />
      <p className="text-xs text-muted-foreground">
        MP3s and AI Explain answers: the least recently used are removed
        automatically. Essays and images are never removed for you; new ones
        stop saving at the limit.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pt-3 text-xs border-t border-dotted">
        <DebugRow label="Offline Japanese voice">
          {voiceModelStatus(voice)}
        </DebugRow>
      </dl>
      {estimate && (
        <StorageUsageBar
          label="Everything this site stores"
          mine={estimate.usage}
          limit={estimate.quota}
          note="The browser's estimate, including offline files. The limit is what this browser allows."
        />
      )}
    </div>
  );
};

/** Mounted only while the modal is open, so the checks below run on open. */
const DebugInfoBody = () => {
  const info = useDebugInfo();
  const storage = useAiStorageUsage();
  const voice = useAiVoiceState();

  // Effect needed: asks the voice engine (outside React, async) whether its
  // files are downloaded; otherwise it only knows after Japanese Voice is used.
  useEffect(() => {
    void initAiVoice();
  }, []);

  const device = info.device;

  return (
    <div className="space-y-5 text-left">
      <DebugSection title="App & device">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          <DebugRow label="Network">
            <span className="inline-flex justify-end w-full">
              <NetworkStatus
                online={info.online}
                effectiveType={info.effectiveType}
                saveData={info.saveData}
              />
            </span>
          </DebugRow>
          <DebugRow label="Version">
            <span className="font-mono">v{info.version}</span>
          </DebugRow>
          <DebugRow label="Viewport">
            {info.viewportWidth}×{info.viewportHeight}
          </DebugRow>
          {device && (
            <>
              <DebugRow label="System">
                {device.os.name} {device.os.version}
              </DebugRow>
              <DebugRow label="Browser">
                {device.browser.name} {device.browser.version}
              </DebugRow>
            </>
          )}
        </dl>
      </DebugSection>
      <div className="pt-5 border-t border-dashed">
        <DebugSection title="Storage on this device">
          <StorageUsage state={storage} voice={voice} />
        </DebugSection>
      </div>
      <div className="flex justify-center pt-3 border-t border-dotted">
        <CopyDebugButton
          getText={() =>
            [
              formatDebugInfoForClipboard(info),
              ...formatStorageForClipboard(storage, voice),
            ].join("\n")
          }
        />
      </div>
    </div>
  );
};

export const DebugInfo = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="outline"
        size="iconXl"
        aria-label="Debug info"
        title="Debug Info"
      >
        <Info className="w-[1.2rem] h-[1.2rem]" />
      </Button>
    </DialogTrigger>
    <ScrollableDialogContent
      size="md"
      title="Debug Info"
      description="App version, device, network and storage details"
      titleClassName="text-left"
    >
      <DebugInfoBody />
    </ScrollableDialogContent>
  </Dialog>
);
