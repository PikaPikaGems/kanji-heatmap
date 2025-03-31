import { useChangeFont } from "@/hooks/use-change-font";
import useKeyboardListener from "@/hooks/use-keyboard-listener";
import { GLOBAL_KEYBOARD_SHORTCUTS } from "@/lib/options/constants";
import { checkIfInputField } from "@/lib/utils";
import { ReactNode } from "react";

export const GlobalKeyboardShortcutProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const nextFont = useChangeFont();
  useKeyboardListener(
    {
      [GLOBAL_KEYBOARD_SHORTCUTS.nextFont]: (event) => {
        if (event.altKey) {
          return;
        }

        if (checkIfInputField(event.target as HTMLElement)) {
          return;
        }

        nextFont();
        event.preventDefault();
      },
    },
    {
      preventDefault: false, // We'll handle preventDefault manually in the handler
      eventType: "keydown",
    }
  );

  return children;
};
