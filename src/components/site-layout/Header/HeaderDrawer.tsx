import { useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Link } from "@/components/dependent/routing";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { docPages } from "@/components/items/nav-items";
import { headerNavLinks } from "@/lib/pages/nav-links";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { DashedNavLinkList } from "@/components/common/DashedNavLinkList";
import { cnTextLink } from "@/lib/generic-cn";
import { HeaderTitle } from "./HeaderTitle";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";
import { DebugInfo } from "../../common/DebugInfo";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";

const infoLinks = [
  { href: docPages.about.href, title: docPages.about.title },
  { href: docPages.terms.href, title: docPages.terms.title },
  { href: docPages.privacy.href, title: docPages.privacy.title },
];

const HeaderDrawerContent = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between z-1000">
          <div onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
            <HeaderTitle />
          </div>
          <div onPointerDown={(e) => e.stopPropagation()}>
            <ModeToggle />
          </div>
        </div>
        <DashedNavLinkList
          items={headerNavLinks}
          className="flex flex-col gap-2"
          iconClassName="mt-0 mr-1"
          onItemPointerDown={(e) => e.stopPropagation()}
          wrapItem={(link) => (
            <DrawerPrimitive.Close asChild>{link}</DrawerPrimitive.Close>
          )}
        />
      </div>

      <div className="flex flex-wrap justify-center w-full gap-2">
        {infoLinks.map((item) => (
          <DrawerPrimitive.Close key={item.href} asChild>
            <Link
              href={item.href}
              onPointerDown={(e) => e.stopPropagation()}
              className={`${cnTextLink} whitespace-nowrap text-xs`}
            >
              {item.title}
            </Link>
          </DrawerPrimitive.Close>
        ))}

        <PikaPikaLinks />

        <div className="mt-4">
          <div className="flex justify-center space-x-1">
            <LinksOutItems />
          </div>
        </div>
      </div>
      <div
        className="flex items-end justify-end pt-4 mt-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DebugInfo />
        <RefreshPageBtn />
      </div>
    </div>
  );
};

const HeaderDrawer = ({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <DrawerPrimitive.Root
      direction="right"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DrawerPrimitive.Trigger asChild>
        <Button variant="outline" size="iconXl" aria-label="Open menu">
          <Menu className="w-7 h-7" />
        </Button>
      </DrawerPrimitive.Trigger>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DrawerPrimitive.Content className="fixed top-0 bottom-0 right-0 z-50 border-l-4 border-dashed shadow-lg outline-none w-72 sm:w-80 bg-background">
          <DrawerPrimitive.Title className="sr-only">
            Navigation menu
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Site navigation links and settings
          </DrawerPrimitive.Description>
          <HeaderDrawerContent onClose={() => setIsOpen(false)} />
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default HeaderDrawer;
