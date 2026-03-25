import { CustomLink, CustomMailLink } from "@/components/common/docs/CustomLink";

export const TermsOfUseSection = () => {
  return (
    <article>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
        Terms of Use
      </h1>
      <div>
        <p className="mb-6 text-sm italic text-muted-foreground">
          <em>Last Updated: December 12, 2025</em>
        </p>

        <p className="mb-4 leading-7">
          By using kanjiheatmap.com (the {`"Site"`}), you agree to these Terms
          of Use and our{" "}
          <CustomLink href={"https://kanjiheatmap.com/docs#privacy"}>
            Privacy Policy
          </CustomLink>
          .
        </p>

        <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
          Acceptable Use
        </h2>

        <p className="mb-4 leading-7">You may not:</p>

        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          <li>Scrape, crawl, or extract data from the Site.</li>
          <li>
            Send bulk requests or engage in any activity to overload or disrupt
            the Site.
          </li>
          <li>Use the Site for any unlawful or harmful purpose.</li>
        </ul>

        <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
          Disclaimer of Warranties
        </h2>

        <p className="mb-4 leading-7">
          The Site is provided {`"as is."`} We do not guarantee that the
          information is accurate, complete, or up-to-date. Use it at your own
          risk.
        </p>

        <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
          Limitation of Liability
        </h2>

        <p className="mb-4 leading-7">
          To the fullest extent allowed by law, we are not liable for any
          damages arising from your use of the Site, including indirect,
          incidental, or consequential damages.
        </p>

        <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
          Changes to These Terms
        </h2>

        <p className="mb-4 leading-7">
          We may update these Terms of Use at any time. Changes will be posted
          here with an updated {`"Last Updated"`} date. Your continued use of
          the Site means you accept the revised terms.
        </p>

        <h2 className="pb-2 mt-10 mb-4 text-3xl font-semibold tracking-tight border-b scroll-m-20 first:mt-0">
          Contact Us
        </h2>

        <p className="mb-4 leading-7">Questions? Reach out at:</p>

        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          <li>
            <CustomMailLink email="admin@pikapikagems.com" />
          </li>
          <li>
            <CustomLink href="https://discord.gg/Ash8ZrGb4s">
              Discord
            </CustomLink>
          </li>
          <li>
            <CustomLink href="https://github.com/PikaPikaGems/kanji-heatmap/issues">
              GitHub
            </CustomLink>
          </li>
        </ul>
      </div>
    </article>
  );
};
