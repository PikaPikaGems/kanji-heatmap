import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { cumUseGraphPageMeta } from "@/lib/pages/nav-links";
import CumUseGraphBody from "./CumUseGraphBody";

const CumUseScreen = () => {
  useHtmlDocumentTitle(cumUseGraphPageMeta.title);
  return <CumUseGraphBody />;
};

export default CumUseScreen;
