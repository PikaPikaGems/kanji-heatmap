import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import {
  DEFAULT_AI_EXPLAIN_PROMPT,
  DEFAULT_AI_EXPLAIN_WORD_PROMPT,
  JAPANESE_TEXT_PLACEHOLDER,
} from "@/lib/ai-explain/preferences";
import {
  DEFAULT_IMAGE_PALETTE_PROMPT,
  DEFAULT_IMAGE_PALETTE_PROMPTS,
  DEFAULT_IMAGE_PROMPT,
  DEFAULT_IMAGE_STYLE_PROMPTS,
  DEFAULT_KANJI_ESSAY_PROMPT,
  DEFAULT_VOCABULARY_PROMPT,
  IMAGE_PALETTE_LABELS,
  IMAGE_STYLE_LABELS,
  type ImagePalette,
  type ImageStyle,
} from "@/lib/ai-explain/prompts";
import type { AiTool } from "@/lib/ai-explain/providers/capabilities";

export type PromptEntry = {
  id: string;
  /** The tool that sends it. */
  tool: AiTool;
  label: string;
  value?: string;
  defaultValue: string;
  placeholders?: string;
  usesSearch?: boolean;
  onChange: (value: string | undefined) => void;
};

/** Every editable prompt, in menu order (palettes, then styles; Custom style last). */
export const usePromptEntries = (): PromptEntry[] => {
  const [settings, update] = useAiExplainSettings();
  const styles = (Object.keys(IMAGE_STYLE_LABELS) as ImageStyle[]).filter(
    (style) => style !== "custom"
  );
  const styleEntry = (style: ImageStyle): PromptEntry => ({
    id: `style:${style}`,
    tool: "mnemonics",
    label: `${IMAGE_STYLE_LABELS[style]} style`,
    value: settings.imageStylePrompts?.[style],
    defaultValue: DEFAULT_IMAGE_STYLE_PROMPTS[style],
    onChange: (value) =>
      update({
        imageStylePrompts: { ...settings.imageStylePrompts, [style]: value },
      }),
  });
  const palettes = (Object.keys(IMAGE_PALETTE_LABELS) as ImagePalette[]).filter(
    (palette) => palette !== "kanji-heatmap"
  );
  const paletteEntry = (palette: ImagePalette): PromptEntry => ({
    id: `palette:${palette}`,
    tool: "mnemonics",
    label: `${IMAGE_PALETTE_LABELS[palette]} palette`,
    value: settings.imagePalettePrompts?.[palette],
    defaultValue: DEFAULT_IMAGE_PALETTE_PROMPTS[palette],
    onChange: (value) =>
      update({
        imagePalettePrompts: {
          ...settings.imagePalettePrompts,
          [palette]: value,
        },
      }),
  });
  return [
    {
      id: "grammar",
      tool: "grammar",
      label: "Grammar Explain",
      value: settings.prompt,
      defaultValue: DEFAULT_AI_EXPLAIN_PROMPT,
      placeholders: `${JAPANESE_TEXT_PLACEHOLDER} (if missing, the sentence is added at the end)`,
      onChange: (prompt) => update({ prompt }),
    },
    {
      id: "word",
      tool: "vocab",
      label: "Vocab Explain",
      value: settings.wordPrompt,
      defaultValue: DEFAULT_AI_EXPLAIN_WORD_PROMPT,
      placeholders: `${JAPANESE_TEXT_PLACEHOLDER} (if missing, the word is added at the end)`,
      onChange: (wordPrompt) => update({ wordPrompt }),
    },
    {
      id: "vocabulary",
      tool: "anchorWord",
      label: "Anchor Word Essay",
      value: settings.vocabularyPrompt,
      defaultValue: DEFAULT_VOCABULARY_PROMPT,
      placeholders: "{WORD}, {READING}, {DICTIONARY_CONTEXT}",
      usesSearch: true,
      onChange: (vocabularyPrompt) => update({ vocabularyPrompt }),
    },
    {
      id: "essay",
      tool: "kanjiEssay",
      label: "Kanji Essay",
      value: settings.kanjiEssayPrompt,
      defaultValue: DEFAULT_KANJI_ESSAY_PROMPT,
      placeholders: "{KANJI}, {KANJI_CONTEXT}",
      usesSearch: true,
      onChange: (kanjiEssayPrompt) => update({ kanjiEssayPrompt }),
    },
    {
      id: "image",
      tool: "mnemonics",
      label: "Visual Mnemonics: shared image",
      value: settings.imagePrompt,
      defaultValue: DEFAULT_IMAGE_PROMPT,
      placeholders:
        "{KANJI}, {KEYWORD}, {DESCRIPTION}, {STYLE_PROMPT}, {PALETTE_PROMPT}",
      onChange: (imagePrompt) => update({ imagePrompt }),
    },
    {
      id: "palette:kanji-heatmap",
      tool: "mnemonics",
      label: "Kanji Heatmap palette",
      value: settings.imagePalettePrompt,
      defaultValue: DEFAULT_IMAGE_PALETTE_PROMPT,
      onChange: (imagePalettePrompt) => update({ imagePalettePrompt }),
    },
    ...palettes.map(paletteEntry),
    ...styles.map(styleEntry),
    styleEntry("custom"),
  ];
};

export const useEditedPromptCount = () =>
  usePromptEntries().filter((entry) => entry.value !== undefined).length;
