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
