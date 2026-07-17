import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { BottomBar } from "@/components/common/BottomBar";
import { DashedNavLinkList } from "@/components/common/DashedNavLinkList";
import { practiceNavLinks } from "@/components/items/nav-links";
const MasteryScreen = () => {
  useHtmlDocumentTitle("Mastery");

  return (
    <div className="flex flex-col w-full max-w-4xl gap-6 px-1 py-5 mx-auto sm:gap-8 sm:px-3 sm:py-8">
      <div className="flex flex-col items-center justify-center flex-1 gap-5  text-center min-h-[50vh]">
        <div className="text-3xl">{"🙇🏽‍♀️ 🙇"}</div>

        <div className="space-y-2">
          <p className="text-xs font-extrabold tracking-wide uppercase text-muted-foreground">
            Coming soon
          </p>
          <p className="max-w-md mx-auto text-sm text-muted-foreground">
            This page isn’t ready yet — keep practicing for now.
          </p>
        </div>

        <DashedNavLinkList
          items={practiceNavLinks}
          className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3"
        />
      </div>

      <div className="pt-4 mt-4 border-t-2 border-dotted">
        <BottomBar justify="center" />
      </div>
    </div>
  );
};

export default MasteryScreen;
