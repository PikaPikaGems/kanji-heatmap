import { useJsonFetch } from "@/hooks/use-json";
import { DefaultErrorFallback } from "@/components/error";
import { ChartData } from "@/components/sections/KanjiCumUseChart/helpers";
import { KanjiCumUseChart } from "@/components/sections/KanjiCumUseChart";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";
import assetsPaths from "@/lib/assets-paths";

/** The graph with its data loading: the page's body and the modal's. */
const CumUseGraphBody = ({ showTitle = true }: { showTitle?: boolean }) => {
  const { data, status } = useJsonFetch(assetsPaths.CUM_USE);

  if (status == "pending") {
    return <PageLoadingFallback />;
  }

  if (status === "error" || data == null) {
    return <DefaultErrorFallback message="Cannot load graph at this time" />;
  }

  return <KanjiCumUseChart data={data as ChartData} showTitle={showTitle} />;
};

export default CumUseGraphBody;
