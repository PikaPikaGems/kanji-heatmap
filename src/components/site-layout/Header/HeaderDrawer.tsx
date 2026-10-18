import { useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Link } from "@/components/dependent/routing";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { docPages } from "@/components/items/nav-items";
import { cumUseGraphPageMeta, headerNavSections } from "@/lib/pages/nav-links";
import { dueNavHrefs, useVisibleNavSections } from "@/lib/pages/mode-nav-links";
import { type DueCounts, useDueCount } from "@/lib/engine/use-due-count";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { CollapsibleNavLinkSections } from "@/components/common/CollapsibleNavLinkSections";
import { cnTextLink } from "@/lib/generic-cn";
import { HeaderTitle } from "./HeaderTitle";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";
import { DebugInfo } from "../../common/DebugInfo";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import {
  SettingsModal,
  SettingsModalTrigger,
} from "@/components/dependent/site-wide/SettingsModal";
import {
  InstallAppModal,
  InstallAppModalTrigger,
} from "@/components/common/InstallAppModal";
import { AccountSection } from "@/components/dependent/account/AccountSection";
import { MockBackendPanel } from "@/components/dependent/account/MockBackendPanel";
import { CumUseGraphModal } from "@/components/screens/CumUseScreen/CumUseGraphModal";

const infoLinks = [
  { href: docPages.about.href, title: docPages.about.title },
  { href: docPages.terms.href, title: docPages.terms.title },
  { href: docPages.privacy.href, title: docPages.privacy.title },
];

const InfoLink = ({ href, title }: { href: string; title: string }) => (
  <DrawerPrimitive.Close asChild>
    <Link
      href={href}
      onPointerDown={(e) => e.stopPropagation()}
      className={`${cnTextLink} whitespace-nowrap text-xs`}
    >
      {title}
    </Link>
  </DrawerPrimitive.Close>
);

type OpenedModal =
  | "none"
  | "sidebar"
  | "install-guide"
  | "settings"
  | "cum-use-graph";

const HeaderDrawerContent = ({
  due,
  onAction,
}: {
  due: DueCounts | null;
  onAction: (modal: OpenedModal) => void;
}) => {
  const navSections = useVisibleNavSections(headerNavSections);

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between z-1000">
          <div
            onClick={() => onAction("none")}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <HeaderTitle />
          </div>
          <div
            className="flex items-center gap-1.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <RefreshPageBtn />
            <ModeToggle />
          </div>
        </div>
        <AccountSection
          tools={
            <>
              <DebugInfo />
              <SettingsModalTrigger
                title="User Preferences"
                onClick={() => onAction("settings")}
              />
            </>
          }
        />
        <CollapsibleNavLinkSections
          sections={navSections}
          dotHrefs={dueNavHrefs(due)}
          listClassName="flex flex-col gap-2"
          onItemPointerDown={(e) => e.stopPropagation()}
          wrapItem={(link, item) => {
            // The graph opens in its modal over the current page, as it did
            // from its old text link, instead of navigating away.
            if (item.href === cumUseGraphPageMeta.href) {
              return (
                <div
                  onClickCapture={(e) => {
                    e.preventDefault();
                    onAction("cum-use-graph");
                  }}
                >
                  {link}
                </div>
              );
            }
            return (
              <DrawerPrimitive.Close asChild>{link}</DrawerPrimitive.Close>
            );
          }}
        />
      </div>

      {/* Dotted line: these links are apart from the menu sections above. */}
      <div className="flex flex-wrap justify-center w-full gap-2 pt-5 border-t-2 border-dotted">
        {infoLinks.map((item) => (
          <InfoLink key={item.href} href={item.href} title={item.title} />
        ))}

        <div className="mt-4">
          <div className="flex justify-center space-x-1">
            <LinksOutItems />
          </div>
        </div>

        <div className="w-full pt-4">
          <PikaPikaLinks />
        </div>
      </div>

      <div className="flex flex-col items-center w-full gap-2 pt-2 mt-6 mb-12 border-t border-dashed">
        <InstallAppModalTrigger onClick={() => onAction("install-guide")} />
        <MockBackendPanel />
      </div>
    </div>
  );
};

const HeaderDrawer = ({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}) => {
  const [openedModal, setOpenedModal] = useState<OpenedModal>(
    initiallyOpen ? "sidebar" : "none"
  );
  const due = useDueCount();

  return (
    <>
      <DrawerPrimitive.Root
        direction="right"
        open={openedModal === "sidebar"}
        onOpenChange={(open) => {
          if (open) {
            setOpenedModal("sidebar");
            return;
          }
          setOpenedModal((current) =>
            current === "sidebar" ? "none" : current
          );
        }}
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
            <HeaderDrawerContent due={due} onAction={setOpenedModal} />
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
      <SettingsModal
        open={openedModal === "settings"}
        onOpenChange={(open) => setOpenedModal(open ? "settings" : "sidebar")}
      />
      <CumUseGraphModal
        open={openedModal === "cum-use-graph"}
        onOpenChange={(open) =>
          setOpenedModal(open ? "cum-use-graph" : "sidebar")
        }
      />
      <InstallAppModal
        open={openedModal === "install-guide"}
        onOpenChange={(open) =>
          setOpenedModal(open ? "install-guide" : "sidebar")
        }
      />
    </>
  );
};

export default HeaderDrawer;
