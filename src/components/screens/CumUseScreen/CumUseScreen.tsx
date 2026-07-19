import { useJsonFetch } from "@/hooks/use-json";

import { DefaultErrorFallback } from "@/components/error";

import { ChartData } from "@/components/sections/KanjiCumUseChart/helpers";
import { KanjiCumUseChart } from "@/components/sections/KanjiCumUseChart";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";
import assetsPaths from "@/lib/assets-paths";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { cumUseGraphPageMeta } from "@/lib/pages/nav-links";

const CumUseScreen = () => {
  const { data, status } = useJsonFetch(assetsPaths.CUM_USE);
  useHtmlDocumentTitle(cumUseGraphPageMeta.title);

  if (status == "pending") {
    return <PageLoadingFallback />;
  }

  if (status === "error" || data == null) {
    return <DefaultErrorFallback message="Cannot load graph at this time" />;
  }

  return <KanjiCumUseChart data={data as ChartData} />;
};

export default CumUseScreen;
