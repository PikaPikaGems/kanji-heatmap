import LinkOutIcon from "@/components/common/LinkOutIcon";
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
