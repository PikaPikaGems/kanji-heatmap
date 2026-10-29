import { MonitorSmartphone, Wifi, WifiOff } from "lucide-react";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { OfflineDownloads } from "@/components/common/OfflineDownloads";
import { useDebugReport } from "@/hooks/use-debug-report";
import type { AiExplainUsage } from "@/lib/ai-explain/preferences";
import { Copy, CheckCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import {
  forwardRef,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from "react";
import { type AiStorageUsageState } from "@/hooks/use-ai-storage-usage";
import { initAiVoice, type AiVoiceState } from "@/lib/ai-voice/engine";
import { AI_STORAGE_LIMITS } from "@/lib/ai-explain/storage-budgets";
import { StorageUsageBar } from "./StorageUsageBar";
import { Progress } from "@/components/ui/progress";
import { UserNotice } from "@/components/common/UserNotice";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
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

const CopyDebugButton = ({ text }: { text: string }) => {
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
        void copy(text, e);
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

const formatCount = (n: number) => n.toLocaleString("en-US");

/** This month's AI usage, counted in this browser. */
const AiUsage = ({ usage }: { usage: AiExplainUsage }) => {
  const [settings] = useAiExplainSettings();
  const budget = settings.monthlyTokenBudget;

  return (
    <div className="space-y-3 text-xs">
      <UserNotice icon="💡" className="text-xs font-bold">
        This is only for AI Study Tools, which use your own xAI API key. If you
        haven&apos;t added one, you can ignore this section.
      </UserNotice>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <DebugRow label="Text tokens">
          <span className="tabular-nums">
            {formatCount(usage.tokens)}
            {budget !== undefined && ` / ${formatCount(budget)}`}
          </span>
        </DebugRow>
        <DebugRow label="Requests">{formatCount(usage.requests)}</DebugRow>
        <DebugRow label="Search calls">{usage.searchCalls}</DebugRow>
        <DebugRow label="Images">{usage.imageRequests}</DebugRow>
        <DebugRow label="Audio generations">{usage.audioRequests}</DebugRow>
        <DebugRow label="Speech characters">
          {formatCount(usage.audioCharacters)}
        </DebugRow>
        {usage.reportedCostUsd > 0 && (
          <DebugRow label="Provider-reported charges">
            US${usage.reportedCostUsd.toFixed(4)}
          </DebugRow>
        )}
      </dl>
      {budget !== undefined && (
        <Progress
          value={Math.min(100, (usage.tokens / budget) * 100)}
          className="h-2"
          primitiveCn={usage.tokens > budget ? "bg-red-500" : undefined}
          aria-label="Tokens used of the monthly budget"
        />
      )}
      <p className="text-muted-foreground">
        Counted in this browser only; restarts each month.
        {usage.unreportedSearchRequests > 0 &&
          ` ${usage.unreportedSearchRequests} searched requests had no provider-reported search count.`}{" "}
        Partial totals: check console.x.ai for your full bill.
      </p>
    </div>
  );
};

/** Mounted only while the modal is open, so the checks below run on open. */
const DebugInfoBody = () => {
  const { info, storage, voice, aiUsage, text } = useDebugReport();

  // Effect needed: asks the voice engine (outside React, async) whether its
  // files are downloaded; otherwise it only knows after Japanese Voice is used.
  useEffect(() => {
    void initAiVoice();
  }, []);

  const device = info.device;

  return (
    <div className="text-left">
      <SimpleAccordion trigger="App and device" defaultOpen>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-2 pb-2 text-xs">
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
      </SimpleAccordion>
      <SimpleAccordion trigger="Storage on this device">
        <div className="px-2 pb-2">
          <StorageUsage state={storage} voice={voice} />
        </div>
      </SimpleAccordion>
      <SimpleAccordion trigger="AI usage this month">
        <div className="px-2 pb-2">
          <AiUsage usage={aiUsage} />
        </div>
      </SimpleAccordion>
      <SimpleAccordion trigger="Offline downloads">
        <div className="px-2 pb-2">
          <OfflineDownloads />
        </div>
      </SimpleAccordion>
      <div className="flex justify-center pt-4">
        <CopyDebugButton text={text} />
      </div>
    </div>
  );
};

// forwardRef needed: `DialogTrigger asChild` hands its ref to the button.
const DebugInfoButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button>
>((props, ref) => (
  <Button
    ref={ref}
    variant="outline"
    size="iconXl"
    aria-label="App and device info"
    title="App & Device Info"
    {...props}
  >
    <MonitorSmartphone className="w-[1.2rem] h-[1.2rem]" />
  </Button>
));
DebugInfoButton.displayName = "DebugInfoButton";

const DebugInfoContent = () => (
  <ScrollableDialogContent
    size="md"
    title="App & Device Info"
    description="App version, device, network, storage, AI usage and offline downloads"
    titleClassName="text-left"
  >
    <DebugInfoBody />
  </ScrollableDialogContent>
);

/** The App & Device Info icon button, opening its own dialog. */
export const DebugInfo = () => (
  <Dialog>
    <DialogTrigger asChild>
      <DebugInfoButton />
    </DialogTrigger>
    <DebugInfoContent />
  </Dialog>
);

/**
 * The icon button alone, for a parent that owns the dialog's open state (the
 * sidebar closes itself first, then reopens when the dialog closes).
 */
export const DebugInfoTrigger = ({ onClick }: { onClick: () => void }) => (
  <DebugInfoButton onClick={onClick} />
);

/** The App & Device Info dialog, controlled by its parent. */
export const DebugInfoModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DebugInfoContent />
  </Dialog>
);
