import { describeAiError } from "@/lib/ai-explain/describe-error";
import {
  abortInFlight,
  getInFlight,
  trackInFlight,
} from "@/lib/ai-explain/in-flight";
import { useEffect, useId, useRef, useState } from "react";
import {
  AiPrimaryButton,
  AiRequestFeedback,
} from "@/components/common/AiActionButtons";
import BasicSelect from "@/components/common/BasicSelect";
import { CollapsibleSection } from "@/components/common/CollapsibleSection";
import { ResponsiveTextarea } from "@/components/common/ResponsiveTextarea";
import {
  readAiExplainSettings,
  isAiExplainReady,
  addAiExplainUsage,
} from "@/lib/ai-explain/preferences";
import {
  buildImagePrompt,
  DEFAULT_AI_IMAGE_MODEL,
  IMAGE_PALETTE_LABELS,
  IMAGE_STYLE_LABELS,
  type ImageStyle,
  type ImagePalette,
} from "@/lib/ai-explain/prompts";
import { generateXaiImage } from "@/lib/ai-explain/xai";
import {
  getGeneratedContentEpoch,
  type MnemonicImage,
} from "@/lib/ai-explain/storage";

type RequestState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; message: string };

export type MnemonicDraft = {
  description: string;
  style: ImageStyle;
  palette: ImagePalette;
  customStyle: string;
  customPalette: string;
  instructions: string;
};

const initialDraft = (image?: MnemonicImage): MnemonicDraft => ({
  description: image?.description ?? "",
  style: image?.style ?? "kanji-heatmap",
  // Images made with a palette that has since been removed fall back to the
  // Kanji Heatmap palette when regenerated.
  palette:
    image && image.palette in IMAGE_PALETTE_LABELS
      ? image.palette
      : "kanji-heatmap",
  customStyle:
    image?.customStyle ??
    readAiExplainSettings().imageStylePrompts?.custom ??
    "",
  customPalette:
    image?.customPalette ??
    readAiExplainSettings().imagePalettePrompts?.custom ??
    "",
  instructions: "",
});

export const MnemonicForm = ({
  kanji,
  keyword,
  image,
  expectedCreatedAt,
  onComplete,
  onPending,
  savedDraft,
  onDraftChange,
}: {
  kanji: string;
  keyword: string;
  image?: MnemonicImage;
  expectedCreatedAt?: number;
  onComplete: (image: MnemonicImage, saved: boolean) => void;
  onPending: (pending: boolean) => void;
  /** What the learner last typed for this slot, kept while they switch away. */
  savedDraft?: MnemonicDraft;
  onDraftChange: (draft: MnemonicDraft) => void;
}) => {
  const id = useId();
  const [draft, setDraftState] = useState<MnemonicDraft>(
    () => savedDraft ?? initialDraft(image)
  );
  const setDraft = (next: MnemonicDraft) => {
    setDraftState(next);
    onDraftChange(next);
  };
  const [request, setRequest] = useState<RequestState>({ status: "idle" });
  // Open while there's no image yet; tucked away once one exists, so the
  // image is what you see after generating.
  const [detailsOpen, setDetailsOpen] = useState(!image);
  const controller = useRef<AbortController | null>(null);
  const pending = request.status === "pending";

  const flightKey = `mnemonic:${kanji}`;

  // Effect needed: aborts the paid request when all generated content is
  // deleted, which render and event handlers can't observe. No abort on
  // unmount: the image is still saved when it arrives.
  useEffect(() => {
    const onChanged = (event: Event) => {
      if (!(event as CustomEvent<{ cleared: boolean }>).detail?.cleared) return;
      abortInFlight(flightKey);
      controller.current = null;
      setRequest({ status: "idle" });
    };
    window.addEventListener("ai-generated-content-changed", onChanged);
    return () => {
      window.removeEventListener("ai-generated-content-changed", onChanged);
    };
  }, [flightKey]);

  const generate = async () => {
    if (
      controller.current ||
      getInFlight(flightKey) ||
      !draft.description.trim()
    )
      return;
    const settings = readAiExplainSettings();
    if (!isAiExplainReady(settings)) {
      setRequest({
        status: "error",
        message:
          "Enable AI Study Tools with a valid API key in User Preferences first.",
      });
      return;
    }
    if (draft.style === "custom" && !draft.customStyle.trim()) return;
    if (draft.palette === "custom" && !draft.customPalette.trim()) return;
    // A new image adds to saved storage; regenerating replaces one.
    if (!image) {
      try {
        const storage = await import("@/lib/ai-explain/storage");
        await storage.assertStorageAvailable("images");
      } catch (error) {
        setRequest({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Couldn't check storage. Try again.",
        });
        return;
      }
    }
    const active = new AbortController();
    const epoch = getGeneratedContentEpoch();
    controller.current = active;
    setRequest({ status: "pending" });
    onPending(true);
    let finish: () => void = () => {};
    trackInFlight(
      flightKey,
      active,
      new Promise<void>((resolve) => (finish = resolve))
    );
    try {
      const prompt = buildImagePrompt(settings, { kanji, keyword, ...draft });
      const model = settings.imageModel ?? DEFAULT_AI_IMAGE_MODEL;
      const resolution = settings.imageResolution ?? "1k";
      const quality = settings.imageQuality ?? "low";
      let reportedCostUsd: number | undefined;
      const blob = await generateXaiImage({
        apiKey: settings.apiKey,
        model,
        prompt,
        resolution,
        quality,
        signal: active.signal,
        onCost: (cost) => {
          reportedCostUsd = cost;
        },
      });
      addAiExplainUsage(0, { imageRequests: 1, reportedCostUsd });
      if (active.signal.aborted) return;
      const result: MnemonicImage = {
        id: image?.id ?? crypto.randomUUID(),
        kanji,
        blob,
        ...draft,
        model,
        resolution,
        quality,
        createdAt: Date.now(),
      };
      let saved = true;
      try {
        const storage = await import("@/lib/ai-explain/storage");
        if (active.signal.aborted) return;
        await storage.saveMnemonicImage(result, expectedCreatedAt, epoch);
      } catch {
        saved = false;
      }
      if (active.signal.aborted) return;
      setRequest({ status: "idle" });
      setDetailsOpen(false);
      onComplete(result, saved);
    } catch (error) {
      if (active.signal.aborted) return;
      setRequest({
        status: "error",
        message: describeAiError(
          error,
          "Couldn't generate the image. Try again."
        ),
      });
    } finally {
      finish();
      if (controller.current === active) {
        controller.current = null;
        if (!active.signal.aborted) onPending(false);
      }
    }
  };

  return (
    <form
      className="space-y-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        void generate();
      }}
    >
      <fieldset disabled={pending} className="space-y-3">
        <CollapsibleSection
          title={image ? "Edit description and style" : "Mnemonic details"}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        >
          <div className="space-y-1">
            <label htmlFor={`${id}-scene`} className="text-sm font-medium">
              Describe your mnemonic
            </label>
            <ResponsiveTextarea
              id={`${id}-scene`}
              title="Describe your mnemonic"
              required
              rows={12}
              maxLength={4000}
              value={draft.description}
              onValueChange={(value) =>
                setDraft({ ...draft, description: value })
              }
              placeholder="Describe a scene that helps you remember this kanji."
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <BasicSelect
                triggerCN="rounded-lg"
                label="Style"
                value={draft.style}
                onChange={(style) =>
                  setDraft({ ...draft, style: style as ImageStyle })
                }
                options={Object.entries(IMAGE_STYLE_LABELS).map(
                  ([value, label]) => ({ value, label })
                )}
              />
            </div>
            <div>
              <BasicSelect
                triggerCN="rounded-lg"
                label="Palette"
                value={draft.palette}
                onChange={(palette) =>
                  setDraft({ ...draft, palette: palette as ImagePalette })
                }
                options={Object.entries(IMAGE_PALETTE_LABELS).map(
                  ([value, label]) => ({ value, label })
                )}
              />
            </div>
          </div>
          {draft.style === "custom" && (
            <div className="space-y-1">
              <label htmlFor={`${id}-custom`} className="text-sm font-medium">
                Custom style description
              </label>
              <ResponsiveTextarea
                id={`${id}-custom`}
                title="Custom style description"
                required
                rows={2}
                maxLength={2000}
                value={draft.customStyle}
                onValueChange={(value) =>
                  setDraft({ ...draft, customStyle: value })
                }
              />
            </div>
          )}
          {draft.palette === "custom" && (
            <div className="space-y-1">
              <label
                htmlFor={`${id}-custom-palette`}
                className="text-sm font-medium"
              >
                Custom palette description
              </label>
              <ResponsiveTextarea
                id={`${id}-custom-palette`}
                title="Custom palette description"
                required
                rows={2}
                maxLength={2000}
                value={draft.customPalette}
                onValueChange={(value) =>
                  setDraft({ ...draft, customPalette: value })
                }
              />
            </div>
          )}
          {image && (
            <div className="space-y-1">
              <label htmlFor={`${id}-changes`} className="text-sm font-medium">
                What should change? (optional)
              </label>
              <ResponsiveTextarea
                id={`${id}-changes`}
                title="What should change?"
                rows={2}
                maxLength={2000}
                value={draft.instructions}
                onValueChange={(value) =>
                  setDraft({ ...draft, instructions: value })
                }
                placeholder="Make the subject larger, or simplify the background."
              />
            </div>
          )}
        </CollapsibleSection>
        <AiPrimaryButton
          type="submit"
          busy={pending}
          busyLabel={image ? "Regenerating…" : "Generating…"}
          disabled={
            !draft.description.trim() ||
            (draft.style === "custom" && !draft.customStyle.trim()) ||
            (draft.palette === "custom" && !draft.customPalette.trim())
          }
        >
          {image ? "Regenerate" : "✨ Generate Visual Mnemonic"}
        </AiPrimaryButton>
      </fieldset>
      <AiRequestFeedback
        busy={pending}
        onCancel={() => {
          abortInFlight(flightKey);
          controller.current = null;
          setRequest({ status: "idle" });
          onPending(false);
        }}
        error={request.status === "error" ? request.message : undefined}
      />
    </form>
  );
};
