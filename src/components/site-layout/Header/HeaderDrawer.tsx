import { useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Link } from "@/components/dependent/routing";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { docPages } from "@/components/items/nav-items";
import { headerNavLinks } from "@/lib/pages/nav-links";
import { dueNavHrefs, useVisibleNavLinks } from "@/lib/pages/mode-nav-links";
import {
  type DueCounts,
  totalDue,
  useDueCount,
} from "@/lib/engine/use-due-count";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { NotificationDot } from "@/components/common/NotificationDot";
import { DashedNavLinkList } from "@/components/common/DashedNavLinkList";
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
import { NetworkStatusBadge } from "@/components/common/NetworkStatusBadge";
import { AccountSection } from "@/components/dependent/account/AccountSection";
import { MockBackendPanel } from "@/components/dependent/account/MockBackendPanel";

const infoLinks = [
  { href: docPages.about.href, title: docPages.about.title },
  { href: docPages.terms.href, title: docPages.terms.title },
  { href: docPages.privacy.href, title: docPages.privacy.title },
];

type OpenedModal = "none" | "sidebar" | "install-guide" | "settings";

const HeaderDrawerContent = ({
  due,
  onAction,
}: {
  due: DueCounts | null;
  onAction: (modal: OpenedModal) => void;
}) => {
  const navLinks = useVisibleNavLinks(headerNavLinks);

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
          <div onPointerDown={(e) => e.stopPropagation()}>
            <ModeToggle />
          </div>
        </div>
        <AccountSection />
        <DashedNavLinkList
          items={navLinks}
          dotHrefs={dueNavHrefs(due)}
          className="flex flex-col gap-2"
          iconClassName="mt-0 mr-1"
          onItemPointerDown={(e) => e.stopPropagation()}
          wrapItem={(link) => (
            <DrawerPrimitive.Close asChild>{link}</DrawerPrimitive.Close>
          )}
        />
      </div>

      <div className="flex flex-wrap justify-center w-full gap-2 pt-4">
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

        <div className="mt-4">
          <div className="flex justify-center space-x-1">
            <LinksOutItems />
          </div>
          <div
            className="flex justify-center w-full pt-1 mt-auto gap-x-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <RefreshPageBtn />
            <DebugInfo />
            <SettingsModalTrigger onClick={() => onAction("settings")} />
          </div>
        </div>

        <PikaPikaLinks />
      </div>

      <div className="flex flex-col items-center w-full gap-2 pt-2 mt-6 mb-12 border-t border-dashed">
        <InstallAppModalTrigger onClick={() => onAction("install-guide")} />
        <NetworkStatusBadge />
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
          <Button
            variant="outline"
            size="iconXl"
            aria-label="Open menu"
            className="relative"
          >
            <Menu className="w-7 h-7" />
            {totalDue(due) > 0 && (
              <NotificationDot className="-top-1 -right-1" />
            )}
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
