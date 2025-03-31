import { ReactNode, useState } from "react";
import { FrequencyType } from "@/lib/options/options-types";
import {
  useItemSettings,
  useItemSettingsDispatch,
} from "@/providers/item-settings-hooks";

import { DottedSeparator } from "@/components/ui/dotted-separator";

import { LabeledCheckbox } from "@/components/common/LabeledCheckbox";
import { FrequencyRankDataSource } from "@/components/common/freq/FrequencyRankDataSource";
import { FreqGradient } from "@/components/common/freq/FreqGradient";
import { ItemTypeSwitch } from "@/components/common/ItemTypeSwitch";
import { JLPTBordersMeanings } from "@/components/common/jlpt/JLPTBorderMeanings";
import { FreqGradientInfoIcon } from "@/components/common/freq/FreqGradientInfoIcon";

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="font-bold border-b-2 border-dotted mt-4 mb-2">{children}</h2>
);

const BackgroundColorSection = ({
  initialState,
  onFalse,
  children,
}: {
  initialState: boolean;
  onFalse: () => void;
  children: ReactNode;
}) => {
  const [shouldAttachMeaning, setShouldAttachMeaning] = useState(initialState);

  return (
    <>
      <H2>
        Background Color Meaning <FreqGradientInfoIcon />
      </H2>
      <LabeledCheckbox
        label="Attach Background Color Meaning"
        value={shouldAttachMeaning}
        onChange={(v) => {
          if (v === false) {
            onFalse();
          }
          setShouldAttachMeaning(v);
        }}
      />
      {shouldAttachMeaning && (
        <>
          <FreqGradient />
          {children}
        </>
      )}
    </>
  );
};

export const ItemPresentationSettingsContent = () => {
  const cardState = useItemSettings();
  const dispatch = useItemSettingsDispatch();

  return (
    <article className="text-left">
      <h1 className="text-lg font-bold flex space-x-2 items-center mb-0 pb-0">
        Item Presentation Settings
      </h1>
      <DottedSeparator className="p-0 m-0" />
      <H2>Design</H2>
      <ItemTypeSwitch
        value={cardState.cardType !== "compact"}
        setValue={(v) => {
          dispatch("cardType", v === false ? "compact" : "expanded");
        }}
      />
      <H2>Border Color Meaning</H2>
      <LabeledCheckbox
        label="Attach Border Color Meaning (JLPT)"
        value={cardState.borderColorAttached}
        onChange={(v) => {
          dispatch("borderColorAttached", v);
        }}
      />
      {cardState.borderColorAttached && <JLPTBordersMeanings />}
      <BackgroundColorSection
        onFalse={() => {
          dispatch("backgroundColorSettingDataSource", "none");
        }}
        initialState={cardState.backgroundColorSettingDataSource !== "none"}
      >
        <FrequencyRankDataSource
          value={cardState.backgroundColorSettingDataSource}
          setValue={(v) => {
            dispatch("backgroundColorSettingDataSource", v as FrequencyType);
          }}
        />
      </BackgroundColorSection>
    </article>
  );
};
