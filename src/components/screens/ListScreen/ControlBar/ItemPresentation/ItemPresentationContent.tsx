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
import { StudyStatusBorderMeanings } from "@/components/common/StudyStatusBorderMeanings";
import { FreqGradientInfoIcon } from "@/components/common/freq/FreqGradientInfoIcon";
import {
  useBgSrc,
  useBgSrcDispatch,
} from "@/components/dependent/routing/routing-hooks";
import BasicSelect from "@/components/common/BasicSelect";
import { BorderColorMeaning } from "@/lib/settings/settings";

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-4 mb-2 font-bold border-b-2 border-dotted">{children}</h2>
);

const BackgroundColorSection = () => {
  const initialState = useBgSrc();
  const dispatch = useBgSrcDispatch();

  const [shouldAttachMeaning, setShouldAttachMeaning] = useState(
    initialState !== "none"
  );

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
            dispatch("none");
          }
          setShouldAttachMeaning(v);
        }}
      />
      {shouldAttachMeaning && (
        <div className="animate-fade-in">
          <FreqGradient />
          <FrequencyRankDataSource
            value={initialState}
            setValue={(v) => {
              dispatch(v as FrequencyType);
            }}
          />
        </div>
      )}
    </>
  );
};

const CardStateSettings = () => {
  const cardState = useItemSettings();
  const dispatch = useItemSettingsDispatch();

  return (
    <>
      <H2>Design</H2>
      <ItemTypeSwitch
        value={cardState.cardType !== "compact"}
        setValue={(v) => {
          dispatch("cardType", v === false ? "compact" : "expanded");
        }}
      />
      <H2>Border Color Meaning</H2>
      <BasicSelect
        value={cardState.borderColorMeaning}
        onChange={(v) => dispatch("borderColorMeaning", v as BorderColorMeaning)}
        label="Border Color Meaning"
        isLabelSrOnly={true}
        options={[
          { value: "jlpt", label: "JLPT Level" },
          { value: "study-status", label: "Study Status" },
          { value: "none", label: "None" },
        ]}
      />
      {cardState.borderColorMeaning === "jlpt" && (
        <div key="jlpt" className="animate-fade-in">
          <JLPTBordersMeanings />
        </div>
      )}
      {cardState.borderColorMeaning === "study-status" && (
        <div key="study-status" className="animate-fade-in">
          <StudyStatusBorderMeanings />
        </div>
      )}
    </>
  );
};

export const ItemPresentationSettingsContent = () => {
  return (
    <article className="text-left">
      <h1 className="flex items-center pb-0 mb-0 space-x-2 text-lg font-bold">
        Item Presentation Settings
      </h1>
      <DottedSeparator className="p-0 m-0" />
      <CardStateSettings />
      <BackgroundColorSection />
    </article>
  );
};
