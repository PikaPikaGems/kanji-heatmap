import { ItemPresentationPopoverShell } from "../ListScreen/ControlBar/ItemPresentation/ItemPresentationPopoverShell";
import {
  CardStateSettings,
  ItemPresentationSettingsFrame,
} from "../ListScreen/ControlBar/ItemPresentation/ItemPresentationContent";
import { MasteryColorSection } from "./MasteryColorSection";

/** The `/` item-presentation popover with the metric picker for its colors. */
const MasteryPresentationPopover = ({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}) => (
  <ItemPresentationPopoverShell initiallyOpen={initiallyOpen}>
    <ItemPresentationSettingsFrame>
      <CardStateSettings />
      <MasteryColorSection />
    </ItemPresentationSettingsFrame>
  </ItemPresentationPopoverShell>
);

export default MasteryPresentationPopover;
