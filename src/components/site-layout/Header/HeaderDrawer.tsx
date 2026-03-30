import { useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Link } from "@/components/dependent/routing";
import { Button } from "@/components/ui/button";
import { ChartLine, Menu, SearchIcon, } from "lucide-react";
import pageItems from "@/components/items/page-items";
import { docPages } from "@/components/items/nav-items";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { cnTextLink } from "@/lib/generic-cn";
import { HeaderTitle } from "./HeaderTitle";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";

const { kanjiPage, cumUseGraphPage } = pageItems;

const navLinks = [
  {
    href: kanjiPage.href,
    title: kanjiPage.title,
    description: kanjiPage.description,
    Icon: SearchIcon
  },
  {
    href: cumUseGraphPage.href,
    title: cumUseGraphPage.title,
    description: cumUseGraphPage.description,
    Icon: ChartLine
  },
];

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
          <div onClick={onClose}>
            <HeaderTitle />
          </div>
          <ModeToggle />
        </div>
        {navLinks.map((item) => (
          <DrawerPrimitive.Close key={item.href} asChild>
            <Link
              href={item.href}
              className="block p-3 transition-colors border border-dashed rounded-lg hover:bg-accent"
            >
              <div className="flex items-center text-sm font-semibold">
                <item.Icon className="mr-1 size-4" />
                {item.title}
              </div>
              {item.description && (
                <p className="mt-1 text-xs text-left text-muted-foreground">
                  {item.description}
                </p>
              )}
            </Link>
          </DrawerPrimitive.Close>
        ))}
      </div>

      <div className="flex flex-wrap justify-center w-full gap-2">
        {infoLinks.map((item) => (
          <DrawerPrimitive.Close key={item.href} asChild>
            <Link
              href={item.href}
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
    </div>
  )
}

const HeaderDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DrawerPrimitive.Root
      direction="right"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DrawerPrimitive.Trigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-xl"
          aria-label="Open menu"
        >
          <Menu className="w-7 h-7" />
        </Button>
      </DrawerPrimitive.Trigger>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DrawerPrimitive.Content className="fixed top-0 bottom-0 right-0 z-50 border-l-4 border-dashed shadow-lg outline-none w-72 sm:w-80 bg-background">
          <DrawerPrimitive.Title className="sr-only">
            Navigation menu
          </DrawerPrimitive.Title>
          <HeaderDrawerContent onClose={() => setIsOpen(false)} />
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default HeaderDrawer;
