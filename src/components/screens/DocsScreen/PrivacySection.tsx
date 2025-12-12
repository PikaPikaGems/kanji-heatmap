import { CustomLink, CustomMailLink } from "@/components/common/docs/CustomLink";

export const PrivacyPolicySection = ({ title }: { title: string }) => {
  return (
    <article>
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground italic mb-6">
        <em>Last Updated: December 12, 2025</em>
      </p>

      <p className="leading-7 mb-4">
        <CustomLink href="https://github.com/PikaPikaGems">
          PikaPikaGems Pte Ltd
        </CustomLink>{" "}
        operates kanjiheatmap.com (the {`"Site"`}). This Privacy Policy explains
        how we handle information related to your use of the Site.
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        Information We Collect
      </h2>

      <p className="leading-7 mb-4">
        We do not collect personal information such as names, email addresses,
        or any other identifiable data directly from you. We also do not use
        cookies or similar tracking technologies.
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        Third-Party Services: Cloudflare
      </h2>

      <p className="leading-7 mb-4">
        We use {"Cloudflare's"} analytics tools to understand how the Site
        performs and how visitors interact with it. These tools include:
      </p>

      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
        <li>
          <strong>HTTP Traffic and Web Analytics</strong>: Cloudflare collects
          and provides us with aggregated, anonymized data about Site usage,
          such as page views and general traffic patterns. This does not include
          personal information about individual visitors.
        </li>
        <li>
          <strong>Real User Measurements (RUM)</strong>: Cloudflare injects a
          small JavaScript snippet into the Site to measure performance and user
          experience (e.g. page load times). This may collect limited technical
          data, such as browser type, device information, or IP addresses, but
          we only receive this data in an aggregated and anonymized form.
        </li>
      </ul>

      <p className="leading-7 mb-4">
        Cloudflare processes this data on our behalf. For more details on how
        Cloudflare handles information, please refer to{" "}
        <CustomLink href="https://www.cloudflare.com/privacypolicy/">
          {"Cloudflare's"} Privacy Policy
        </CustomLink>
        .
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        How We Use Information
      </h2>

      <p className="leading-7 mb-4">
        The anonymized data from Cloudflare helps us monitor the {`Site's `}
        performance and improve its functionality. We do not use this data to
        identify or track individual visitors.
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        Sharing of Information
      </h2>

      <p className="leading-7 mb-4">
        We do not sell, trade, or share any personal information with third
        parties because we {"don't"} collect it. The aggregated analytics data
        from Cloudflare is used solely by us for the purposes described above.
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        Your Choices
      </h2>

      <p className="leading-7 mb-4">
        Since we {"don't"} collect personal information or use cookies, there
        are no specific privacy settings for you to manage on the Site. If you
        have concerns about {"Cloudflare's"} analytics, you can review their
        practices directly or use browser tools (like Do Not Track settings) to
        limit data collection, though this may not fully apply to aggregated
        analytics.
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        Changes to This Policy
      </h2>

      <p className="leading-7 mb-4">
        We may update this Privacy Policy from time to time. If we do, the
        updated version will be posted here with a revised {`"Last Updated"`}{" "}
        date.
      </p>

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
        Contact Us
      </h2>

      <p className="leading-7 mb-4">
        If you have questions about this Privacy Policy, feel free to reach out:
      </p>

      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
        <li>
          <CustomMailLink email="privacy@pikapikagems.com"/>
        </li>
        <li>
          <CustomLink href="https://discord.gg/Ash8ZrGb4s">Discord</CustomLink>
        </li>
        <li>
          <CustomLink href="https://github.com/PikaPikaGems/kanji-heatmap/issues">
            GitHub
          </CustomLink>
        </li>
      </ul>
    </article>
  );
};
