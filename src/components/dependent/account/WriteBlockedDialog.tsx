import type { ReactNode } from "react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { UserNotice } from "@/components/common/UserNotice";
import LinkOutIcon from "@/components/common/LinkOutIcon";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { copyForWriteBlocker } from "@/lib/engine/engine-copy";
import type { WriteBlocker } from "@/lib/engine/use-account-status";
import {
  closeWriteBlockedDialog,
  openWriteBlockedDialog,
  useWriteBlockedDialogOpen,
} from "@/lib/engine/write-blocked-dialog";
import { CONTACT_ITEMS } from "./contact-items";

/**
 * The underlined "Learn more" after the premium-lapsed copy. A plain button
 * (not NoticeAction) so the sidebar can wrap it in `DrawerPrimitive.Close`.
 */
export const WriteBlockedLearnMore = () => (
  <button
    type="button"
    onClick={openWriteBlockedDialog}
    className="font-bold underline rounded-sm underline-offset-4 decoration-2 hover-text-theme-color-with-opacity-100"
  >
    Learn more
  </button>
);

/**
 * Why a logged-in account can't save (premium lapsed), mounted once in App
 * and opened from "Learn more".
 */
export const WriteBlockedDialog = () => {
  const open = useWriteBlockedDialogOpen();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeWriteBlockedDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Why can't my account save?"
        description="Saving needs an active Kanji Heatmap Premium membership"
        titleClassName="text-left"
      >
        <div className="flex flex-col gap-4 text-sm text-left text-pretty">
          <p>
            Saving needs an active Kanji Heatmap Premium membership, and yours
            isn&apos;t active right now. It may have ended, or a payment may not
            have gone through.
          </p>
          <ul className="flex flex-col gap-2 pl-5 list-disc">
            <li>
              Everything you saved before is safe and still shows on this
              device.
            </li>
            <li>
              You can&apos;t review, edit notes or update bookmarks and your
              review pile until your membership is active again.
            </li>
            <li>
              You can keep practicing. Those rounds just aren&apos;t recorded.
            </li>
          </ul>
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-dotted">
            <p className="font-bold text-center">
              Message us to renew, or if you think this is a mistake.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {CONTACT_ITEMS.map((item) => (
                <LinkOutIcon
                  key={item.href}
                  href={item.href}
                  hoverText={item.text}
                  srOnlyText={item.text}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
          <PracticeButton size="md" onClick={closeWriteBlockedDialog}>
            Got it
          </PracticeButton>
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};

/** A write blocker's copy, with "Learn more" when the premium lapsed. */
export const WriteBlockerCopy = ({ blocker }: { blocker: WriteBlocker }) => (
  <>
    {copyForWriteBlocker(blocker)}
    {blocker === "premium_lapsed" && (
      <>
        {" "}
        <WriteBlockedLearnMore />
      </>
    )}
  </>
);

/**
 * A write action the account can't do right now (premium lapsed, saving
 * paused, out of storage): the button stays tappable and opens a popover
 * with the reason (and "Learn more" when premium lapsed) instead of a line
 * of text under it.
 */
export const WriteBlockedPopover = ({
  blocker,
  trigger,
}: {
  blocker: WriteBlocker;
  trigger: ReactNode;
}) => (
  <GenericPopover
    // Inside the kanji drawer: modal, or the popover can't be clicked.
    modal
    trigger={trigger}
    content={
      <UserNotice className="px-4 py-3 text-sm max-w-64">
        <WriteBlockerCopy blocker={blocker} />
      </UserNotice>
    }
  />
);
