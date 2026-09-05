import { useState, type ComponentProps, type ReactNode } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { outLinks } from "@/lib/external-links";

const FIND_ADD_TO_HOME_SCREEN = (
  <>
    Find{" "}
    <strong>
      {`"`}Add to Home Screen{`"`}
    </strong>{" "}
    (scroll or tap <strong>View More</strong>)
  </>
);

const TAP_ADD_TO_HOME_SCREEN = (
  <>
    Tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>
  </>
);

const SAFARI_STEPS: ReactNode[] = [
  <>
    Tap ··· (the three dots) next to the address bar, then tap{" "}
    <strong>Share</strong>
  </>,
  FIND_ADD_TO_HOME_SCREEN,
  TAP_ADD_TO_HOME_SCREEN,
];

const CHROME_STEPS: ReactNode[] = [
  <>
    Tap the <strong>share icon</strong> on the right of the address bar
  </>,
  FIND_ADD_TO_HOME_SCREEN,
  TAP_ADD_TO_HOME_SCREEN,
];

const sectionHeadingCn =
  "mb-3 border-b-2 border-dotted text-xs font-extrabold uppercase tracking-widest text-muted-foreground text-left";

const BrowserGuide = ({
  name,
  steps,
}: {
  name: string;
  steps: ReactNode[];
}) => (
  <section>
    <h3 className={sectionHeadingCn}>{name}</h3>
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3 text-left">
          <span className="mt-0.5 flex shrink-0  text-foreground/30 justify-center rounded-full text-xs font-semibold tabular-nums">
            {index + 1}
          </span>
          <p className="min-w-0 text-xs leading-relaxed">{step}</p>
        </li>
      ))}
    </ol>
  </section>
);

export const InstallAppModalTrigger = (props: ComponentProps<"button">) => (
  <button
    type="button"
    onPointerDown={(e) => e.stopPropagation()}
    className="inline-flex items-center gap-1 text-[10px] leading-loose underline cursor-pointer decoration-dotted underline-offset-4 hover:text-neon-accent whitespace-nowrap"
    {...props}
  >
    <Download size={14} />
    <strong>Install on iOS Guide</strong>
  </button>
);

export const InstallAppModal = ({
  open: openProp,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <InstallAppModalTrigger />
        </DialogTrigger>
      )}
      <ScrollableDialogContent
        size="md"
        title="Install Kanji Heatmap on iOS"
        description="Install Kanji Heatmap on iPhone or iPad"
        titleClassName="text-left"
        bodyClassName="px-6 pb-6"
      >
        <p className="mt-3 mb-5 text-xs font-bold text-left">
          Follow the steps below for full-screen access and one-tap launch — no
          App Store needed. Need help? Message us on{" "}
          <ExternalTextLink
            href={outLinks.discord}
            text="Discord"
            className="px-0.5 py-0"
          />{" "}
          or{" "}
          <ExternalTextLink
            href={outLinks.githubIssue}
            text="GitHub."
            className="px-0.5 py-0"
          />
        </p>
        <div className="flex flex-col gap-6">
          <BrowserGuide name="Safari" steps={SAFARI_STEPS} />
          <BrowserGuide name="Chrome" steps={CHROME_STEPS} />
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
