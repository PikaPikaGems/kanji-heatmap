import { useChangeFont } from "@/hooks/use-change-font";
import useKeyboardListener from "@/hooks/use-keyboard-listener";
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
      "`": (event) => {
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
