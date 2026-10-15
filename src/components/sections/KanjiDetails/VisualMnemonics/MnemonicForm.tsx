import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { PracticeButton } from "@/components/ui/practice-button";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import {
  readAiExplainSettings,
  isAiExplainReady,
  addAiExplainUsage,
} from "@/lib/ai-explain/preferences";
import {
  buildImagePrompt,
  DEFAULT_AI_IMAGE_MODEL,
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

const MnemonicTextarea = (props: ComponentProps<"textarea">) => (
  <textarea
    {...props}
    className="block w-full resize-y rounded-xl border-[3px] border-dotted border-border bg-background p-3.5 font-mono text-base leading-[1.55rem] whitespace-pre-wrap break-words outline-none focus:border-ring focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
  />
);

export const MnemonicForm = ({
  kanji,
  keyword,
  image,
  expectedCreatedAt,
  onComplete,
  onPending,
}: {
  kanji: string;
  keyword: string;
  image?: MnemonicImage;
  expectedCreatedAt?: number;
  onComplete: (image: MnemonicImage, saved: boolean) => void;
  onPending: (pending: boolean) => void;
}) => {
  const id = useId();
  const [draft, setDraft] = useState({
    description: image?.description ?? "",
    style: image?.style ?? ("kanji-heatmap" as ImageStyle),
    palette: image?.palette ?? ("kanji-heatmap" as ImagePalette),
    customStyle:
      image?.customStyle ??
      readAiExplainSettings().imageStylePrompts?.custom ??
      "",
    instructions: "",
  });
  const [request, setRequest] = useState<RequestState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const pending = request.status === "pending";

  // Effect needed: abort external paid requests on unmount or storage clearing;
  // render/event handlers cannot observe external clearing or reliably clean up.
  useEffect(() => {
    const onChanged = (event: Event) => {
      if (!(event as CustomEvent<{ cleared: boolean }>).detail?.cleared) return;
      controller.current?.abort();
      controller.current = null;
      setRequest({ status: "idle" });
    };
    window.addEventListener("ai-generated-content-changed", onChanged);
    return () => {
      controller.current?.abort();
      window.removeEventListener("ai-generated-content-changed", onChanged);
    };
  }, []);

  const generate = async () => {
    if (controller.current || !draft.description.trim()) return;
    const settings = readAiExplainSettings();
    if (!isAiExplainReady(settings)) {
      setRequest({
        status: "error",
        message:
          "Enable AI Explain with a valid API key in User Preferences first.",
      });
      return;
    }
    if (draft.style === "custom" && !draft.customStyle.trim()) return;
    const active = new AbortController();
    const epoch = getGeneratedContentEpoch();
    controller.current = active;
    setRequest({ status: "pending" });
    onPending(true);
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
        prompt,
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
      onComplete(result, saved);
    } catch (error) {
      if (active.signal.aborted) return;
      setRequest({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Couldn't generate the image. Try again.",
      });
    } finally {
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
        <div className="space-y-1">
          <label htmlFor={`${id}-scene`} className="text-sm font-medium">
            Describe your mnemonic
          </label>
          <MnemonicTextarea
            id={`${id}-scene`}
            required
            rows={3}
            maxLength={4000}
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
            placeholder="Describe a scene that helps you remember this kanji."
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <ResponsiveSelect
              label="Style"
              value={draft.style}
              onChange={(style) =>
                setDraft({ ...draft, style: style as ImageStyle })
              }
              options={[
                { value: "kanji-heatmap", label: "Kanji Heatmap" },
                { value: "watercolor", label: "Watercolor" },
                { value: "pixel-art", label: "16-bit game art" },
                { value: "cartoon", label: "Cartoon or anime" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </div>
          <div>
            <ResponsiveSelect
              label="Palette"
              value={draft.palette}
              onChange={(palette) =>
                setDraft({ ...draft, palette: palette as ImagePalette })
              }
              options={[
                { value: "kanji-heatmap", label: "Kanji Heatmap" },
                { value: "lime", label: "Lime" },
                { value: "cyan", label: "Cyan / aqua" },
                { value: "blue", label: "Blue" },
                { value: "pink", label: "Hot pink" },
                { value: "grayscale", label: "Black and white" },
              ]}
            />
          </div>
        </div>
        {draft.style === "custom" && (
          <div className="space-y-1">
            <label htmlFor={`${id}-custom`} className="text-sm font-medium">
              Custom style description
            </label>
            <MnemonicTextarea
              id={`${id}-custom`}
              required
              rows={2}
              maxLength={2000}
              value={draft.customStyle}
              onChange={(event) =>
                setDraft({ ...draft, customStyle: event.target.value })
              }
            />
          </div>
        )}
        {image && (
          <div className="space-y-1">
            <label htmlFor={`${id}-changes`} className="text-sm font-medium">
              What should change? (optional)
            </label>
            <MnemonicTextarea
              id={`${id}-changes`}
              rows={2}
              maxLength={2000}
              value={draft.instructions}
              onChange={(event) =>
                setDraft({ ...draft, instructions: event.target.value })
              }
              placeholder="Make the subject larger, or simplify the background."
            />
          </div>
        )}
        <PracticeButton
          type="submit"
          variant="primary"
          size="md"
          className="h-auto min-h-12 whitespace-normal px-3 py-3 text-sm sm:text-base"
          disabled={
            !draft.description.trim() ||
            (draft.style === "custom" && !draft.customStyle.trim())
          }
        >
          {pending
            ? "Generating image…"
            : image
              ? "Regenerate"
              : "✨ Generate Visual Mnemonic"}
        </PracticeButton>
      </fieldset>
      {pending && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            controller.current?.abort();
            controller.current = null;
            setRequest({ status: "idle" });
            onPending(false);
          }}
        >
          Cancel generation
        </Button>
      )}
      {request.status === "error" && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {request.message}
        </p>
      )}
    </form>
  );
};
