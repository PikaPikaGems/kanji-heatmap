import CumUseChartWrapper from "@/components/sections/KanjiCumUseChart/CumUseChartWrapper";
import { KeyLegend } from "@/components/sections/KanjiCumUseChart/KeyLegend";
import { CumUseGraph } from "@/components/sections/KanjiCumUseChart/CumUseGraph";
import { ChartData } from "./helpers";

export const KanjiCumUseChart = ({
  data,
  showTitle = true,
}: {
  data: ChartData;
  showTitle?: boolean;
}) => {
  return (
    <CumUseChartWrapper
      showTitle={showTitle}
      legends={
        <>
          {Object.keys(data).map((key) => {
            return <KeyLegend key={key} freqKey={key} />;
          })}
        </>
      }
    >
      <CumUseGraph data={data as ChartData} />
    </CumUseChartWrapper>
  );
};
