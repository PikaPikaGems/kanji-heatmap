import LinkOutIcon from "@/components/common/LinkOutIcon";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { CONTACT_ITEMS } from "./contact-items";

/** The X, Discord, Instagram and email icon links, centered in a row. */
export const ContactIcons = () => (
  <div className="flex flex-wrap items-center justify-center gap-1.5">
    {CONTACT_ITEMS.map((item) => (
      <LinkOutIcon
        key={item.href}
        href={item.href}
        hoverText={item.text}
        srOnlyText={item.text}
        icon={item.icon}
      />
    ))}
  </div>
);

/** An emoji and its link, kept together on one line. */
export const EmojiLink = ({
  emoji,
  href,
  text,
}: {
  emoji: string;
  href: string;
  text: string;
}) => (
  <span className="whitespace-nowrap">
    <span aria-hidden>{emoji}</span>{" "}
    <ExternalTextLink href={href} text={text} className="p-0" />
  </span>
);
