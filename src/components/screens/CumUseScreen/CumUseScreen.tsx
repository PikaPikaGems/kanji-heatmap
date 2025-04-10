import { useJsonFetch } from "@/hooks/use-json";

import { DefaultErrorFallback } from "@/components/error";

import { ChartData } from "@/components/sections/KanjiCumUseChart/helpers";
import { KanjiCumUseChart } from "@/components/sections/KanjiCumUseChart";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import assetsPaths from "@/lib/assets-paths";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import pageItems from "@/components/items/page-items";

const CumUseScreen = () => {
  const { data, status } = useJsonFetch(assetsPaths.CUM_USE);
  useHtmlDocumentTitle(pageItems.cumUseGraphPage.title);

  if (status == "pending") {
    return <KaomojiAnimation />;
  }

  if (status === "error" || data == null) {
    return <DefaultErrorFallback message="Cannot load graph at this time" />;
  }

  return <KanjiCumUseChart data={data as ChartData} />;
};

export default CumUseScreen;
