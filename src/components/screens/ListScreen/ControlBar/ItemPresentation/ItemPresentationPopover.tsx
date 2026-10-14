import { ItemPresentationPopoverShell } from "./ItemPresentationPopoverShell";
import { ItemPresentationSettingsContent } from "./ItemPresentationContent";

const ItemPresentationSettingsPopover = ({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}) => (
  <ItemPresentationPopoverShell initiallyOpen={initiallyOpen}>
    <ItemPresentationSettingsContent />
  </ItemPresentationPopoverShell>
);

export default ItemPresentationSettingsPopover;
