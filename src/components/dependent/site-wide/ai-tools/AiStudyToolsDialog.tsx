import { Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SavedAiContentLoading } from "@/components/common/OwnedAiContent";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { hasAnyValidAiKey } from "@/lib/ai-explain/preferences";
import {
  closeAiStudyTools,
  setAiStudyToolsTab,
  useAiStudyToolsDialog,
  type AiToolsTab,
} from "@/lib/ai-explain/ai-tools-dialog";
import { useCurrentOwner } from "@/lib/engine/content-owner";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { ApiKeysTab } from "./ApiKeysTab";
import { ToolsTab } from "./ToolsTab";
import { UsageTab } from "./UsageTab";

/** The AI Study Tools icon button; it opens the app-wide dialog. */
export const AiStudyToolsTrigger = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="outline"
    size="iconXl"
    aria-label="Open AI Study Tools"
    title="AI Study Tools"
    onClick={onClick}
  >
    <Sparkles className="w-[1.2rem] h-[1.2rem]" />
  </Button>
);

const TAB_OPTIONS: { value: AiToolsTab; label: string }[] = [
  { value: "keys", label: "API keys" },
  { value: "tools", label: "Tools" },
  { value: "usage", label: "Usage & Saved" },
];

/** The switch for every AI feature; it needs a key that works. */
const EnableSwitch = () => {
  const [settings, update] = useAiExplainSettings();
  const keyOk = hasAnyValidAiKey(settings);
  // The saved choice is kept while the key is missing or rejected, so a
  // working key turns it back on.
  const active = settings.enabled && keyOk;
  return (
    <div className="space-y-2">
      <div className="flex items-center py-1">
        <Switch
          checked={active}
          disabled={!keyOk}
          onCheckedChange={(enabled) => update({ enabled })}
          aria-label="Enable AI Study Tools"
        />
        <span
          className={cn(
            "px-2 text-sm font-semibold",
            !keyOk && "text-muted-foreground"
          )}
        >
          Enable AI Study Tools
        </span>
      </div>
      {!keyOk && (
        <p className="text-xs text-muted-foreground">
          Add an API key that works (in API keys) to turn this on.
        </p>
      )}
      {active && (
        <p
          role="note"
          className={cn(
            "p-2 text-xs border rounded-lg animate-fade-in-fast border-amber-500/50",
            cnWarningText
          )}
        >
          Heads up: what you generate is saved only in this browser. It
          isn&apos;t backed up and can be lost if browser data is cleared, and
          anyone using this computer can see it. Download anything you want to
          keep.
        </p>
      )}
    </div>
  );
};

/** The switch and the three tabs of one owner. */
const OwnedAiStudyTools = ({ ownerId }: { ownerId: string }) => {
  const { tab } = useAiStudyToolsDialog();
  return (
    <div className="space-y-4">
      <EnableSwitch />
      <Tabs
        value={tab}
        onValueChange={(next) => setAiStudyToolsTab(next as AiToolsTab)}
      >
        <SegmentedTabsList
          value={tab}
          label="AI Study Tools"
          className="w-full text-xs"
          options={TAB_OPTIONS}
        />
        {/* Radix mounts only the open tab, so each switch fades in. */}
        <TabsContent value="keys" className="mt-4 animate-fade-in-fast">
          <ApiKeysTab ownerId={ownerId} />
        </TabsContent>
        <TabsContent value="tools" className="mt-4 animate-fade-in-fast">
          <ToolsTab />
        </TabsContent>
        <TabsContent value="usage" className="mt-4 animate-fade-in-fast">
          <UsageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AiStudyToolsBody = () => {
  const owner = useCurrentOwner();
  return (
    <div className="mx-1 text-left">
      <p className="mb-3 text-xs text-muted-foreground">
        Explain sentences and words, write anchor word and kanji essays, read
        them aloud as MP3s and draw visual mnemonics. Requests go straight from
        this browser to the provider and are billed to your own account.
      </p>
      {/* Until we know whose keys these are, show none. */}
      {owner.status === "unknown" ? (
        <SavedAiContentLoading />
      ) : (
        <div key={owner.ownerId} className="animate-fade-in-fast">
          <OwnedAiStudyTools ownerId={owner.ownerId} />
        </div>
      )}
    </div>
  );
};

/** The app-wide AI Study Tools dialog; open it with `openAiStudyTools()`. */
export const AiStudyToolsDialog = () => {
  const { open } = useAiStudyToolsDialog();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAiStudyTools();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="AI Study Tools (Experimental)"
        description="API keys, the provider and model of each tool, usage this month and saved content"
        titleClassName="text-left"
      >
        <AiStudyToolsBody />
      </ScrollableDialogContent>
    </Dialog>
  );
};
