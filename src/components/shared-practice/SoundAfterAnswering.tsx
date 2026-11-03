import type { ReactNode } from "react";
import { TtsNotice } from "@/components/dependent/account/TtsNotice";
import { RadioRow } from "./RadioRow";
import type { SoundMode, SoundSetting } from "./sound-setting";

type SoundChoice = "off" | SoundMode;

const CHOICES: { value: SoundChoice; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "correct", label: "Chime" },
  { value: "speak", label: "Say aloud" },
];

/**
 * Every practice game's "Sound after answering: Off / Chime / Say aloud",
 * first among its options. A game's other sound toggle (read aloud when a
 * card appears) goes in `children`, above the text-to-speech notice.
 */
export const SoundAfterAnswering = ({
  sound,
  onChange,
  children,
  childrenSpeak = false,
}: {
  sound: SoundSetting;
  onChange: (sound: SoundSetting) => void;
  children?: ReactNode;
  /** True when the option in `children` is on and uses text-to-speech. */
  childrenSpeak?: boolean;
}) => {
  const current: SoundChoice = sound.enabled ? sound.type : "off";
  const speaks = current === "speak" || childrenSpeak;

  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex flex-wrap items-center text-left gap-y-1">
        <legend className="sr-only">Sound after answering</legend>
        <span className="w-full pr-4 text-sm sm:w-auto" aria-hidden>
          Sound after answering:
        </span>
        {CHOICES.map(({ value, label }) => (
          <RadioRow
            key={value}
            name="sound-after-answering"
            value={value}
            current={current}
            label={label}
            onChange={(next) =>
              onChange(
                next === "off"
                  ? { enabled: false }
                  : { enabled: true, type: next }
              )
            }
          />
        ))}
      </fieldset>
      {children}
      {speaks && <TtsNotice className="w-full animate-fade-in-fast" />}
    </div>
  );
};
