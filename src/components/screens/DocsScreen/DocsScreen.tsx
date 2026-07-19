import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { MarkdownDoc } from "@/components/common/docs/MarkdownDoc";
import type { ReactNode } from "react";

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex justify-center w-full py-24 text-left ">
      <div className="w-fit md:max-w-4xl">{children}</div>
    </div>
  );
};

export const AboutPage = () => {
  useHtmlDocumentTitle("About");
  return (
    <Wrapper>
      <MarkdownDoc path="/md/about.md" />
    </Wrapper>
  );
};

export const TermsPage = () => {
  useHtmlDocumentTitle("Terms of Use");
  return (
    <Wrapper>
      <MarkdownDoc path="/md/terms.md" />
    </Wrapper>
  );
};

export const PrivacyPage = () => {
  useHtmlDocumentTitle("Privacy Policy");
  return (
    <Wrapper>
      <MarkdownDoc path="/md/privacy.md" />
    </Wrapper>
  );
};
