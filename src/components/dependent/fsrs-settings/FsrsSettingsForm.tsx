import { useState } from "react";
import type { EngineAPI, ReviewSettings } from "engine-contract";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  copyForCode,
  copyForWriteBlocker,
  REVIEW_SETTINGS_UPDATE_COPY,
} from "@/lib/engine/engine-copy";
import {
  LEARNING_PRESETS,
  readSavedSteps,
  RELEARNING_PRESETS,
  writeSavedSteps,
} from "@/lib/engine/fsrs-steps";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import type { WriteBlocker } from "@/lib/engine/use-account-status";
import { SwitchField, Warning } from "./FieldParts";
import { IntervalField } from "./IntervalField";
import { ModelWeightsField } from "./ModelWeightsField";
import { RetentionField } from "./RetentionField";
import { StepsField } from "./StepsField";

/** Why Save is disabled; `null` when saving is possible. */
export type SaveBlocker =
  | { kind: "signed-out" }
  | { kind: "update-required" }
  | { kind: "write"; reason: WriteBlocker };

type SaveStatus =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "saved" }
  | { kind: "invalid"; field: keyof ReviewSettings; reason: string }
  | { kind: "error"; message: string };

const BlockerBanner = ({ blocker }: { blocker: SaveBlocker }) => (
  <p
    role="status"
    className="p-3 text-sm border rounded-xl bg-muted/40 text-muted-foreground"
  >
    {blocker.kind === "signed-out" && (
      <>
        You&apos;re not logged in.{" "}
        <button
          type="button"
          className="font-semibold underline text-foreground underline-offset-4"
          onClick={openLoginDialog}
        >
          Log in
        </button>{" "}
        to save your settings.
      </>
    )}
    {blocker.kind === "update-required" && REVIEW_SETTINGS_UPDATE_COPY}
    {blocker.kind === "write" && copyForWriteBlocker(blocker.reason)}
  </p>
);

/** Steps to bring back when "Enable short term" is switched on again. */
const restoredSteps = (defaults: ReviewSettings): Partial<ReviewSettings> => {
  const saved = readSavedSteps();
  return {
    learningStepsMinutes:
      saved.learning ??
      (defaults.learningStepsMinutes.length > 0
        ? defaults.learningStepsMinutes
        : LEARNING_PRESETS[0].steps),
    relearningStepsMinutes:
      saved.relearning ??
      (defaults.relearningStepsMinutes.length > 0
        ? defaults.relearningStepsMinutes
        : RELEARNING_PRESETS[0].steps),
  };
};

/**
 * The FSRS settings form. Edits a local draft seeded from `initial`; it is
 * deliberately not bound to the settings store, and the settings returned by
 * a save become the new draft (host/guide/REVIEWS.md).
 */
export const FsrsSettingsForm = ({
  api,
  initial,
  blocker,
  notice,
}: {
  api: EngineAPI;
  initial: ReviewSettings;
  blocker: SaveBlocker | null;
  /** Extra context shown above the form that doesn't block saving. */
  notice: string | null;
}) => {
  const defaults = api.reviews.settings.defaultSettings;
  const [draft, setDraft] = useState(initial);
  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });
  const busy = save.kind === "busy";
  const shortTermOn =
    draft.learningStepsMinutes.length > 0 ||
    draft.relearningStepsMinutes.length > 0;

  const edit = (patch: Partial<ReviewSettings>) => {
    setDraft({ ...draft, ...patch });
    if (!busy) setSave({ kind: "idle" });
  };

  const errorFor = (field: keyof ReviewSettings) =>
    save.kind === "invalid" && save.field === field ? save.reason : undefined;

  const setShortTerm = (on: boolean) => {
    if (on) {
      edit(restoredSteps(defaults));
      return;
    }
    if (shortTermOn) {
      writeSavedSteps({
        learning: draft.learningStepsMinutes,
        relearning: draft.relearningStepsMinutes,
      });
    }
    edit({ learningStepsMinutes: [], relearningStepsMinutes: [] });
  };

  const saveSettings = async () => {
    if (blocker !== null || busy) return;
    setSave({ kind: "busy" });
    // Pull other devices' changes first so the two don't overlap. Settings
    // stay editable offline, and a failed catch-up must not stop the save.
    if (navigator.onLine) await api.sync.catchUp();
    const result = await api.reviews.settings.update(draft);
    if (result.ok) {
      setDraft(result.value);
      setSave({ kind: "saved" });
      return;
    }
    if (result.error.code === "invalid_settings") {
      setSave({
        kind: "invalid",
        field: result.error.field,
        reason: result.error.reason,
      });
      return;
    }
    setSave({ kind: "error", message: copyForCode(result.error.code) });
  };

  return (
    <>
      <div className="flex-1 min-h-0 px-6 pb-4 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-2 text-left">
          {blocker !== null && <BlockerBanner blocker={blocker} />}
          {notice !== null && save.kind !== "saved" && (
            <Warning>{notice}</Warning>
          )}
          <div className="grid items-start gap-x-10 gap-y-5 md:grid-cols-2">
            <div className="flex flex-col gap-5">
              <RetentionField
                value={draft.requestRetention}
                onChange={(requestRetention) => edit({ requestRetention })}
                error={errorFor("requestRetention")}
              />
              <IntervalField
                days={draft.maximumIntervalDays}
                onChange={(maximumIntervalDays) =>
                  edit({ maximumIntervalDays })
                }
                error={errorFor("maximumIntervalDays")}
              />
              <SwitchField
                id="fsrs-enable-fuzz"
                title="Enable fuzz"
                tip="Adds a small, repeatable variation to intervals so cards learned together don't all come due on the same day."
                checked={draft.enableFuzz}
                onCheckedChange={(enableFuzz) => edit({ enableFuzz })}
                error={errorFor("enableFuzz")}
              />
              <ModelWeightsField
                weights={draft.modelWeights}
                defaultWeights={defaults.modelWeights}
                onChange={(modelWeights) => edit({ modelWeights })}
                error={errorFor("modelWeights")}
              />
            </div>
            <div className="flex flex-col gap-5">
              <SwitchField
                id="fsrs-enable-short-term"
                title="Enable short term"
                tip="Repeats a new or forgotten card a few times within the day (the learning steps) before it moves to day-long intervals. Off means no steps."
                checked={shortTermOn}
                onCheckedChange={setShortTerm}
              />
              <StepsField
                title="Learning steps"
                presets={LEARNING_PRESETS}
                steps={draft.learningStepsMinutes}
                disabled={!shortTermOn}
                onChange={(learningStepsMinutes) =>
                  edit({ learningStepsMinutes })
                }
                error={errorFor("learningStepsMinutes")}
              />
              <StepsField
                title="Relearning steps"
                presets={RELEARNING_PRESETS}
                steps={draft.relearningStepsMinutes}
                disabled={!shortTermOn}
                onChange={(relearningStepsMinutes) =>
                  edit({ relearningStepsMinutes })
                }
                error={errorFor("relearningStepsMinutes")}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 px-6 py-3 text-left border-t shrink-0">
        <p className="text-xs text-muted-foreground">
          Saving settings does not immediately move existing due dates. Changes
          normally apply when you next review a card. A full data refresh may
          also recalculate schedules.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => edit(defaults)}
          >
            Restore all defaults
          </Button>
          <div className="flex items-center gap-3">
            {save.kind === "saved" && (
              <span
                role="status"
                className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500"
              >
                <Check className="size-4" aria-hidden />
                Saved
              </span>
            )}
            <Button
              type="button"
              disabled={blocker !== null || busy}
              onClick={() => void saveSettings()}
            >
              {busy && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </div>
        {save.kind === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {save.message}
          </p>
        )}
      </div>
    </>
  );
};
