import { GenericPopover } from "@/components/common/GenericPopover";
import { cn } from "@/lib/utils";
import { ContactIcons } from "./ContactIcons";

/**
 * An underlined "let us know" that opens a small pop-up: "Message us and
 * we'll help." with the contact icons. `modal` inside a dialog or drawer, or
 * the pop-up can't be clicked.
 */
export const LetUsKnowAction = ({ modal = false }: { modal?: boolean }) => (
  <GenericPopover
    modal={modal}
    focusOnOpen={false}
    trigger={
      <button
        type="button"
        className="font-bold underline rounded-sm underline-offset-4 decoration-2 hover-text-theme-color-with-opacity-100"
      >
        let us know
      </button>
    }
    content={
      <div className="flex flex-col gap-3 p-4 w-72">
        <p className="text-sm font-bold text-center">
          Message us and we&apos;ll help.
        </p>
        <ContactIcons />
      </div>
    }
  />
);

/** "💬 If this keeps failing, let us know and we'll sort it out." */
export const LetUsKnowLine = ({
  before = "If this keeps failing, ",
  after = " and we'll sort it out.",
  modal,
  className,
}: {
  before?: string;
  after?: string;
  modal?: boolean;
  className?: string;
}) => (
  <p
    className={cn(
      "text-sm font-semibold text-left text-foreground text-pretty",
      className
    )}
  >
    <span aria-hidden className="mr-1.5">
      💬
    </span>
    {before}
    <LetUsKnowAction modal={modal} />
    {after}
  </p>
);
