import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { PrivacyPolicySection } from "./PrivacySection";
import { TermsOfUseSection } from "./TermsOfUseSection";
import { AboutSection } from "./AboutSection";
import type { ReactNode } from "react";

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex justify-center w-full py-24 text-left ">
      <div className="w-fit md:max-w-4xl">{children}
      </div>
    </div>
  )
}

export const AboutPage = () => {
  useHtmlDocumentTitle("About");
  return (

    <Wrapper>
      <AboutSection />
    </Wrapper>
  );
};

export const TermsPage = () => {
  useHtmlDocumentTitle("Terms of Use");
  return (
    <Wrapper>
      <TermsOfUseSection />
    </Wrapper>
  );
};

export const PrivacyPage = () => {
  useHtmlDocumentTitle("Privacy Policy");
  return (
    <Wrapper>
      <PrivacyPolicySection />
    </Wrapper>
  );
};
