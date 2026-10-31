import { useState } from "react";
import type { EngineAPI, ReviewSettings } from "engine-contract";
import { Loader2, RotateCcw } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { DialogActions } from "@/components/common/DialogActions";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { LoginNotice } from "@/components/dependent/account/LoginNotice";
import { WriteBlockedLearnMore } from "@/components/dependent/account/WriteBlockedDialog";
import { Accordion } from "@/components/ui/accordion";
import { PracticeButton } from "@/components/ui/practice-button";
import { copyForCode, copyForWriteBlocker } from "@/lib/engine/engine-copy";
import { closeFsrsSettings } from "@/lib/engine/fsrs-settings-dialog";
import {
  LEARNING_PRESETS,
  readSavedSteps,
  RELEARNING_PRESETS,
  writeSavedSteps,
} from "@/lib/engine/fsrs-steps";
import type { WriteBlocker } from "@/lib/engine/use-account-status";
import { forceHardRefresh } from "@/lib/force-hard-refresh";
import { SettingsSection, SwitchField } from "./FieldParts";
import { IntervalField } from "./IntervalField";
import { fitIntervalToSlider, sliderMaxMonths } from "./interval-limits";
import { ModelWeightsField } from "./ModelWeightsField";
import { RetentionField } from "./RetentionField";
import { StepsField } from "./StepsField";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/** Why Save is disabled; `null` when saving is possible. */
export type SaveBlocker =
  | { kind: "signed-out" }
  | { kind: "update-required" }
  | { kind: "write"; reason: WriteBlocker };

type SaveStatus =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "invalid"; field: keyof ReviewSettings; reason: string }
  | { kind: "error"; message: string };

type SectionId = "intervals" | "steps" | "advanced";

/** The section that holds each field, so a field error can open it. */
const SECTION_OF_FIELD: Record<keyof ReviewSettings, SectionId> = {
  requestRetention: "intervals",
  maximumIntervalDays: "intervals",
  enableFuzz: "intervals",
  learningStepsMinutes: "steps",
  relearningStepsMinutes: "steps",
  modelWeights: "advanced",
};

const BlockerNotice = ({ blocker }: { blocker: SaveBlocker }) => {
  if (blocker.kind === "signed-out") {
    return <LoginNotice to="save your review settings" />;
  }
  if (blocker.kind === "update-required") {
    return (
      <UserNotice>
        This page is out of date.{" "}
        <NoticeAction onClick={() => void forceHardRefresh()}>
          Refresh
        </NoticeAction>{" "}
        to change your review settings.
      </UserNotice>
    );
  }
  if (blocker.reason === "entitlement_expired") {
    return (
      <UserNotice>
        Your account can&apos;t save changes right now, so these settings are
        read-only. <WriteBlockedLearnMore />
      </UserNotice>
    );
  }
  return <UserNotice>{copyForWriteBlocker(blocker.reason)}</UserNotice>;
};

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
 * deliberately not bound to the settings store, and a successful save closes
 * the dialog, so the next open starts from the saved settings
 * (host/guide/REVIEWS.md).
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
  const engineMaxDays = defaults.maximumIntervalDays;
  // A maximum interval above the slider's range is shown (and saved) at its end.
  const [draft, setDraft] = useState(() =>
    fitIntervalToSlider(initial, engineMaxDays)
  );
  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });
  const [openSections, setOpenSections] = useState<string[]>(["intervals"]);
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
      closeFsrsSettings();
      return;
    }
    if (result.error.code === "invalid_settings") {
      const { field, reason } = result.error;
      setSave({ kind: "invalid", field, reason });
      // Open the field's section so its error is visible.
      const section = SECTION_OF_FIELD[field];
      setOpenSections((open) =>
        open.includes(section) ? open : [...open, section]
      );
      return;
    }
    setSave({ kind: "error", message: copyForCode(result.error.code) });
  };

  return (
    <>
      <div className="flex-1 min-h-0 px-4 pb-6 overflow-y-auto text-left">
        {(blocker !== null || notice !== null) && (
          <div className="flex flex-col gap-2 px-2 pt-2 pb-3">
            {blocker !== null && <BlockerNotice blocker={blocker} />}
            {notice !== null && <UserNotice>{notice}</UserNotice>}
          </div>
        )}
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          <SettingsSection value="intervals" title="Retention & Intervals">
            <RetentionField
              value={draft.requestRetention}
              onChange={(requestRetention) => edit({ requestRetention })}
              error={errorFor("requestRetention")}
            />
            <IntervalField
              days={draft.maximumIntervalDays}
              maxMonths={sliderMaxMonths(engineMaxDays)}
              onChange={(maximumIntervalDays) => edit({ maximumIntervalDays })}
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
          </SettingsSection>
          <SettingsSection value="steps" title="Learning Steps">
            <SwitchField
              id="fsrs-enable-short-term"
              title="Enable short term"
              tip="Repeats a new or forgotten card a few times within the day (the learning steps) before it moves to day-long intervals. Off means no steps."
              checked={shortTermOn}
              onCheckedChange={setShortTerm}
            />
            {shortTermOn && (
              <div className="flex flex-col gap-6 animate-fade-in-fast">
                <StepsField
                  title="Learning steps"
                  presets={LEARNING_PRESETS}
                  steps={draft.learningStepsMinutes}
                  onChange={(learningStepsMinutes) =>
                    edit({ learningStepsMinutes })
                  }
                  error={errorFor("learningStepsMinutes")}
                />
                <StepsField
                  title="Relearning steps"
                  presets={RELEARNING_PRESETS}
                  steps={draft.relearningStepsMinutes}
                  onChange={(relearningStepsMinutes) =>
                    edit({ relearningStepsMinutes })
                  }
                  error={errorFor("relearningStepsMinutes")}
                />
              </div>
            )}
          </SettingsSection>
          <SettingsSection value="advanced" title="Advanced">
            <ModelWeightsField
              weights={draft.modelWeights}
              defaultWeights={defaults.modelWeights}
              onChange={(modelWeights) => edit({ modelWeights })}
              error={errorFor("modelWeights")}
            />
          </SettingsSection>
        </Accordion>
        <div className="flex flex-col items-start gap-2 px-2 pt-4">
          <TextActionButton
            icon={<RotateCcw size={14} />}
            className="-ml-1"
            disabled={busy}
            onClick={() => edit(fitIntervalToSlider(defaults, engineMaxDays))}
          >
            Restore all defaults
          </TextActionButton>
          <p className="text-xs text-muted-foreground">
            Saving settings does not immediately move existing due dates.
            Changes normally apply when you next review a card. A full data
            refresh may also recalculate schedules.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-6 py-4 border-t shrink-0">
        {/* A blocker notice above already says why saving failed. */}
        {save.kind === "error" && blocker === null && (
          <p role="alert" className={cn("text-sm text-left", cnWarningText)}>
            {save.message}
          </p>
        )}
        <DialogActions>
          <PracticeButton variant="ghost" onClick={closeFsrsSettings}>
            Cancel
          </PracticeButton>
          <PracticeButton
            disabled={blocker !== null || busy}
            onClick={() => void saveSettings()}
          >
            {busy && <Loader2 className="size-5 animate-spin" aria-hidden />}
            {busy ? "Saving…" : "Save"}
          </PracticeButton>
        </DialogActions>
      </div>
    </>
  );
};
