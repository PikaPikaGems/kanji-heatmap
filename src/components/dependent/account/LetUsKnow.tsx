import { GenericPopover } from "@/components/common/GenericPopover";
import { cn } from "@/lib/utils";
import { outLinks } from "@/lib/external-links";
import { ContactIcons, EmojiLink } from "./ContactIcons";

/**
 * An underlined "let us know" that opens a small pop-up: "Message us on X,
 * Instagram or Discord" with the contact icons. `modal` inside a dialog or drawer, or
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
        <p className="text-sm text-center text-foreground text-pretty">
          Message us on{" "}
          <EmojiLink emoji="🐦" href={outLinks.twitter} text="X/Twitter" />,{" "}
          <EmojiLink emoji="📷" href={outLinks.instagram} text="Instagram" /> or{" "}
          <EmojiLink emoji="💬" href={outLinks.discord} text="Discord" />, and
          we&apos;ll do our best to help!
        </p>
        <ContactIcons />
      </div>
    }
  />
);

/** "💬 If this keeps failing, let us know." */
export const LetUsKnowLine = ({
  before = "If this keeps failing, ",
  after = ".",
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
