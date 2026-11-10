import { CheckCircle, Copy } from "@/components/icons";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useId, useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { RotateCcw } from "lucide-react";
import { ResponsiveTextarea } from "@/components/common/ResponsiveTextarea";
import {
  DownloadMarkdownButton,
  TextActionButton,
} from "@/components/common/AiActionButtons";
import BasicSelect from "@/components/common/BasicSelect";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { usePromptEntries } from "@/hooks/use-prompt-entries";
import type { AiTool } from "@/lib/ai-explain/providers/capabilities";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { updateAiToolChoice } from "@/lib/ai-explain/preferences";
import {
  IMAGE_PALETTE_LABELS,
  IMAGE_STYLE_LABELS,
  type ImagePalette,
  type ImageStyle,
} from "@/lib/ai-explain/prompts";

type PromptEditorProps = {
  title: string;
  value?: string;
  defaultValue: string;
  placeholders?: string;
  onChange: (value: string | undefined) => void;
};
const PromptEditor = ({
  title,
  value,
  defaultValue,
  placeholders,
  onChange,
}: PromptEditorProps) => {
  const id = useId();
  const { copy, status } = useCopyToClipboard(1500);
  const current = value ?? defaultValue;
  return (
    <div className="mb-4 space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold">
        {title}
      </label>
      <ResponsiveTextarea
        id={id}
        title={title}
        rows={10}
        value={current}
        onValueChange={(next) =>
          onChange(next === defaultValue ? undefined : next)
        }
        spellCheck={false}
      />
      {/* Under the editor, left-aligned: reset · copy. */}
      <div className="flex flex-wrap items-center gap-1">
        <TextActionButton
          icon={<RotateCcw size={14} />}
          onClick={() => onChange(undefined)}
          disabled={value === undefined}
        >
          Reset to default
        </TextActionButton>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <TextActionButton
          icon={
            status === "copied" ? (
              <CheckCircle className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5" />
            )
          }
          onClick={(e) => void copy(current, e)}
        >
          {status === "copied" ? "Copied" : "Copy prompt"}
        </TextActionButton>
      </div>
      {placeholders && (
        <p className="text-xs text-muted-foreground">
          Placeholders: {placeholders}
        </p>
      )}
    </div>
  );
};

/** Every prompt in one file: a "#" heading per prompt and its text in a fence. */
const allPromptsMarkdown = (
  entries: { label: string; value?: string; defaultValue: string }[]
) =>
  entries
    .map((entry) => {
      const text = entry.value ?? entry.defaultValue;
      // A longer fence than any backtick run inside keeps the block intact.
      const longestRun = Math.max(
        0,
        ...(text.match(/`+/g) ?? []).map((run) => run.length)
      );
      const fence = "`".repeat(Math.max(3, longestRun + 1));
      return `# ${entry.label}\n${fence}md\n${text}\n${fence}\n`;
    })
    .join("\n");

/**
 * The prompts one tool sends: an editor, with a picker when it has several
 * (Visual Mnemonics: the shared image prompt, palettes and styles).
 */
export const ToolPrompts = ({ tool }: { tool: AiTool }) => {
  const entries = usePromptEntries().filter((entry) => entry.tool === tool);
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const selected =
    entries.find((entry) => entry.id === selectedId) ?? entries[0];
  if (!selected) return null;
  return (
    <div className="space-y-3">
      {entries.length > 1 && (
        <div className="space-y-1">
          <p aria-hidden className="text-sm font-semibold">
            Prompt to edit
          </p>
          <BasicSelect
            isLabelSrOnly
            triggerCN="rounded-lg"
            label="Prompt to edit"
            value={selected.id}
            onChange={setSelectedId}
            options={entries.map((entry) => ({
              value: entry.id,
              label:
                entry.value === undefined
                  ? entry.label
                  : `${entry.label} (edited)`,
            }))}
          />
        </div>
      )}
      <PromptEditor
        key={selected.id}
        title={entries.length > 1 ? selected.label : "Prompt"}
        value={selected.value}
        defaultValue={selected.defaultValue}
        placeholders={selected.placeholders}
        onChange={selected.onChange}
      />
    </div>
  );
};

/**
 * A Visual Mnemonics default (style or palette): the pick pre-selected for
 * new images.
 */
const MnemonicDefault = <K extends string>({
  label,
  labels,
  value,
  idPrefix,
  note,
  onPick,
}: {
  label: string;
  labels: Record<K, string>;
  value: K;
  /** Prompt entry ids are `${idPrefix}${key}`. */
  idPrefix: string;
  note: string;
  onPick: (key: K) => void;
}) => {
  const entries = usePromptEntries();
  const edited = (key: string) =>
    entries.find((entry) => entry.id === `${idPrefix}${key}`)?.value !==
    undefined;
  return (
    <div className="space-y-1">
      <p aria-hidden className="text-sm font-semibold">
        {label}
      </p>
      <BasicSelect
        isLabelSrOnly
        triggerCN="rounded-lg"
        label={label}
        value={value}
        onChange={(key) => onPick(key as K)}
        options={(Object.keys(labels) as K[]).map((key) => ({
          value: key,
          label: edited(key) ? `${labels[key]} (edited)` : labels[key],
        }))}
      />
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
};

type MnemonicTab = "style" | "palette" | "prompt";

const MNEMONIC_TABS: { value: MnemonicTab; label: string }[] = [
  { value: "style", label: "Style" },
  { value: "palette", label: "Palette" },
  { value: "prompt", label: "Prompt" },
];

/** An entry's editor, or nothing when the entry is missing. */
const EntryEditor = ({ id, title }: { id: string; title: string }) => {
  const entry = usePromptEntries().find((item) => item.id === id);
  if (!entry) return null;
  return (
    <PromptEditor
      title={title}
      value={entry.value}
      defaultValue={entry.defaultValue}
      placeholders={entry.placeholders}
      onChange={entry.onChange}
    />
  );
};

/**
 * A "Show prompt" switch, off at first, over what it reveals; says when an
 * edited prompt is in use so it isn't forgotten while hidden.
 */
const PromptSwitch = ({
  label,
  edited,
  children,
}: {
  label: string;
  edited: boolean;
  children: ReactNode;
}) => {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Switch id={id} checked={shown} onCheckedChange={setShown} />
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {edited && (
          <span className="text-xs text-muted-foreground">
            · You&apos;ve edited it
          </span>
        )}
      </div>
      {shown && <div className="animate-fade-in-fast">{children}</div>}
    </div>
  );
};

/** A tool's prompts behind a "Show prompt" switch. */
export const PromptToggle = ({
  tool,
  children,
}: {
  tool: AiTool;
  children: ReactNode;
}) => {
  const entries = usePromptEntries().filter((entry) => entry.tool === tool);
  return (
    <PromptSwitch
      label={entries.length > 1 ? "Show prompts" : "Show prompt"}
      edited={entries.some((entry) => entry.value !== undefined)}
    >
      {children}
    </PromptSwitch>
  );
};

/**
 * Visual Mnemonics' style and palette (each the default for new images, with
 * its prompt behind a switch) and the shared image prompt, one tab at a time.
 */
export const MnemonicSettings = () => {
  const [settings] = useAiExplainSettings();
  const [tab, setTab] = useState<MnemonicTab>("style");
  const entries = usePromptEntries();
  const edited = (id: string) =>
    entries.find((entry) => entry.id === id)?.value !== undefined;
  const choice = settings.tools.mnemonics ?? {};
  const style = choice.style ?? "kanji-heatmap";
  const palette = choice.palette ?? "kanji-heatmap";
  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as MnemonicTab)}>
      <SegmentedTabsList
        value={tab}
        label="Visual Mnemonics style, palette and prompt"
        className="w-full text-xs"
        options={MNEMONIC_TABS}
      />
      {/* Radix mounts only the open tab, so each switch fades in. */}
      <TabsContent
        value="style"
        className="mt-3 space-y-4 animate-fade-in-fast"
      >
        <MnemonicDefault<ImageStyle>
          label="Default style"
          labels={IMAGE_STYLE_LABELS}
          value={style}
          idPrefix="style:"
          note="Picked for new mnemonics; you can still change it per image."
          onPick={(next) =>
            updateAiToolChoice("mnemonics", {
              style: next === "kanji-heatmap" ? undefined : next,
            })
          }
        />
        <PromptSwitch label="Show prompt" edited={edited(`style:${style}`)}>
          <p className="mb-2 text-xs text-muted-foreground">
            Fills {"{STYLE_PROMPT}"} in the image prompt. For Custom, this text
            pre-fills the custom style box.
          </p>
          {/* Keyed by the pick: its prompt fades in when it changes. */}
          <div key={style} className="animate-fade-in-fast">
            <EntryEditor
              id={`style:${style}`}
              title={`${IMAGE_STYLE_LABELS[style]} style prompt`}
            />
          </div>
        </PromptSwitch>
      </TabsContent>
      <TabsContent
        value="palette"
        className="mt-3 space-y-4 animate-fade-in-fast"
      >
        <MnemonicDefault<ImagePalette>
          label="Default palette"
          labels={IMAGE_PALETTE_LABELS}
          value={palette}
          idPrefix="palette:"
          note="Picked for new mnemonics; you can still change it per image."
          onPick={(next) =>
            updateAiToolChoice("mnemonics", {
              palette: next === "kanji-heatmap" ? undefined : next,
            })
          }
        />
        <PromptSwitch label="Show prompt" edited={edited(`palette:${palette}`)}>
          <p className="mb-2 text-xs text-muted-foreground">
            Fills {"{PALETTE_PROMPT}"} in the image prompt. For Custom, this
            text pre-fills the custom palette box.
          </p>
          <div key={palette} className="animate-fade-in-fast">
            <EntryEditor
              id={`palette:${palette}`}
              title={`${IMAGE_PALETTE_LABELS[palette]} palette prompt`}
            />
          </div>
        </PromptSwitch>
      </TabsContent>
      <TabsContent value="prompt" className="mt-3 animate-fade-in-fast">
        <EntryEditor id="image" title="Image prompt" />
      </TabsContent>
    </Tabs>
  );
};

/** Every prompt of every tool, as one Markdown file. */
export const DownloadAllPrompts = () => {
  const entries = usePromptEntries();
  return (
    <div className="flex justify-center">
      <DownloadMarkdownButton
        markdown={allPromptsMarkdown(entries)}
        filename="kanji-heatmap-ai-prompts.md"
        label="Download all prompts"
      />
    </div>
  );
};
