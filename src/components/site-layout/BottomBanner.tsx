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
      <div className="fixed bottom-0 flex items-center justify-center w-full fix-scroll-layout-shift-right">
        <div
          style={{
            bottom: "env(safe-area-inset-bottom)",
            width: "calc(100vw - 30px)",
          }}
          className="flex items-center justify-center my-1 text-xs font-extrabold md:hidden "
        >
          <div className="px-4 py-1 text-black bg-lime-400 rounded-xl w-fit">
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
      👀 Look! {`It's`}
      <ExternalTextLink href={outLinks.ririkku} text={"Ririkku"} />
      {"♥️"}
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
