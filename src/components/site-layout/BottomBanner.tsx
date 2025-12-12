import { ReactNode } from "react";
import { useNetworkState } from "@/hooks/use-network-state";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { outLinks } from "@/lib/external-links";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="fix-scroll-layout-shift-right hidden md:block fixed bottom-0 left-0 bg-lime-400 text-black w-full text-sm font-extrabold px-1 pt-1 pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
      <div className="fix-scroll-layout-shift-right fixed bottom-0 w-full flex items-center justify-center">
        <div
          style={{
            bottom: "env(safe-area-inset-bottom)",
            width: "calc(100vw - 30px)",
          }}
          className="flex md:hidden  my-1 items-center justify-center text-xs font-extrabold "
        >
          <div className="bg-lime-400 text-black py-1 px-4 rounded-xl w-fit">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export const SocialLinksCTA = () => {
  return (
    <>
      {"(◠_◠)"} Say hi on
      <ExternalTextLink href={outLinks.discord} text="Discord," />
      <ExternalTextLink href={outLinks.twitter} text="X/Twitter," />
      or
      <ExternalTextLink href={outLinks.githubIssue} text={"GitHub"} />
      {"👋"}
    </>
  );
};

const RirikkuCTA = () => {
  return (
    <>
      👀 Look! The {"World's"} Coolest{"™"}
      <ExternalTextLink href={outLinks.ririkku} text={"J-Music App"} />
      {"♫"}
    </>
  );
};
const BottomBanner = () => {
  const network = useNetworkState();

  if (!network.online) {
    return (
      <Layout>
        {"(｡•́︿•̀｡)"} Some parts may not work offline.{" "}
        {`Don't worry  you can still use the site 💖`}
      </Layout>
    );
  }

  const longerToLoadMsg = "some parts may take longer to load 🐢";

  if (network.saveData === true) {
    return (
      <Layout>
        {"(╭ರ_•́)"} It seems that {`you're`} in data-saving mode,{" "}
        {longerToLoadMsg}
      </Layout>
    );
  }

  if (["slow-2g", "2g", "3g"].includes(network.effectiveType ?? "")) {
    return (
      <Layout>
        {`(๑ > ᴗ < ๑) Your connection seems a bit slow (${network.effectiveType}),`}{" "}
        {longerToLoadMsg}
      </Layout>
    );
  }

  return (
    <Layout>
      <RirikkuCTA />
    </Layout>
  );
};

export default BottomBanner;
