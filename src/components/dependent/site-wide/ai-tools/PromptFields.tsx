import { CheckCircle, Copy } from "@/components/icons";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ResponsiveTextarea } from "@/components/common/ResponsiveTextarea";
import {
  DownloadMarkdownButton,
  TextActionButton,
} from "@/components/common/AiActionButtons";
import BasicSelect from "@/components/common/BasicSelect";
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
 * One choice (style or palette) of Visual Mnemonics: a picker whose pick is
 * the default for new images, and the prompt of what's picked.
 */
const MnemonicChoice = <K extends string>({
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
  const entryOf = (key: string) =>
    entries.find((entry) => entry.id === `${idPrefix}${key}`);
  const selected = entryOf(value);
  return (
    <section className="space-y-2">
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
            label:
              entryOf(key)?.value === undefined
                ? labels[key]
                : `${labels[key]} (edited)`,
          }))}
        />
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      {selected && (
        // Keyed by the pick: its prompt fades in when it changes.
        <div key={selected.id} className="animate-fade-in-fast">
          <PromptEditor
            title={`${labels[value]} ${label.toLowerCase()} prompt`}
            value={selected.value}
            defaultValue={selected.defaultValue}
            placeholders={selected.placeholders}
            onChange={selected.onChange}
          />
        </div>
      )}
    </section>
  );
};

/**
 * Visual Mnemonics' prompts: the shared image prompt, then the style and the
 * palette, each with its picker (the default for new images) and prompt.
 */
export const MnemonicPrompts = () => {
  const [settings] = useAiExplainSettings();
  const entries = usePromptEntries();
  const image = entries.find((entry) => entry.id === "image");
  const choice = settings.tools.mnemonics ?? {};
  return (
    <div className="space-y-5">
      {image && (
        <PromptEditor
          title="Image prompt"
          value={image.value}
          defaultValue={image.defaultValue}
          placeholders={image.placeholders}
          onChange={image.onChange}
        />
      )}
      <MnemonicChoice<ImageStyle>
        label="Style"
        labels={IMAGE_STYLE_LABELS}
        value={choice.style ?? "kanji-heatmap"}
        idPrefix="style:"
        note="Picked for new mnemonics; you can still change it per image. Its prompt fills {STYLE_PROMPT}. For Custom, this text pre-fills the custom style box."
        onPick={(style) =>
          updateAiToolChoice("mnemonics", {
            style: style === "kanji-heatmap" ? undefined : style,
          })
        }
      />
      <MnemonicChoice<ImagePalette>
        label="Palette"
        labels={IMAGE_PALETTE_LABELS}
        value={choice.palette ?? "kanji-heatmap"}
        idPrefix="palette:"
        note="Picked for new mnemonics; you can still change it per image. Its prompt fills {PALETTE_PROMPT}. For Custom, this text pre-fills the custom palette box."
        onPick={(palette) =>
          updateAiToolChoice("mnemonics", {
            palette: palette === "kanji-heatmap" ? undefined : palette,
          })
        }
      />
    </div>
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
