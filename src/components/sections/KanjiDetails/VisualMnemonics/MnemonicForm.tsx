import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
      className="space-y-3"
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
          <textarea
            id={`${id}-scene`}
            required
            rows={3}
            maxLength={4000}
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
            placeholder="Describe a scene that helps you remember this kanji."
            className="w-full rounded-md border border-input bg-background p-3 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            Style
            <select
              value={draft.style}
              onChange={(event) =>
                setDraft({ ...draft, style: event.target.value as ImageStyle })
              }
              className="h-10 w-full rounded-md border border-input bg-background px-2"
            >
              <option value="kanji-heatmap">Kanji Heatmap</option>
              <option value="watercolor">Watercolor</option>
              <option value="pixel-art">16-bit game art</option>
              <option value="cartoon">Cartoon or anime</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            Palette
            <select
              value={draft.palette}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  palette: event.target.value as ImagePalette,
                })
              }
              className="h-10 w-full rounded-md border border-input bg-background px-2"
            >
              <option value="kanji-heatmap">Kanji Heatmap</option>
              <option value="lime">Lime</option>
              <option value="cyan">Cyan / aqua</option>
              <option value="blue">Blue</option>
              <option value="pink">Hot pink</option>
              <option value="grayscale">Black and white</option>
            </select>
          </label>
        </div>
        {draft.style === "custom" && (
          <div className="space-y-1">
            <label htmlFor={`${id}-custom`} className="text-sm font-medium">
              Custom style description
            </label>
            <textarea
              id={`${id}-custom`}
              required
              rows={2}
              maxLength={2000}
              value={draft.customStyle}
              onChange={(event) =>
                setDraft({ ...draft, customStyle: event.target.value })
              }
              className="w-full rounded-md border border-input bg-background p-3 text-sm"
            />
          </div>
        )}
        {image && (
          <div className="space-y-1">
            <label htmlFor={`${id}-changes`} className="text-sm font-medium">
              What should change? (optional)
            </label>
            <textarea
              id={`${id}-changes`}
              rows={2}
              maxLength={2000}
              value={draft.instructions}
              onChange={(event) =>
                setDraft({ ...draft, instructions: event.target.value })
              }
              placeholder="Make the subject larger, or simplify the background."
              className="w-full rounded-md border border-input bg-background p-3 text-sm"
            />
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
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
        </Button>
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
        <p role="alert" className="text-sm text-destructive">
          {request.message}
        </p>
      )}
    </form>
  );
};
