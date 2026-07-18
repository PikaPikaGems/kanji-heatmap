import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { ScreenShell } from "@/components/common/ScreenShell";
import { DashedNavLinkList } from "@/components/common/DashedNavLinkList";
import { practiceNavLinks } from "@/components/items/nav-links";
const MasteryScreen = () => {
  useHtmlDocumentTitle("Mastery");

  return (
    <ScreenShell>
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
    </ScreenShell>
  );
};

export default MasteryScreen;
