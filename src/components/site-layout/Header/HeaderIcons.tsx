import { useEffect, useState } from "react";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";
import { EllipsisIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MenuItems = () => {
  return (
    <div className="flex space-x-1">
      <ModeToggle />
      <LinksOutItems />
    </div>
  );
};

export function Menu({ cn }: { cn: string }) {
  const [isOpen, setIsOpen] = useState(false);
  // Effect needed: subscribes to window resize to close the menu (the event
  // itself is the trigger, not a derived value).
  useEffect(() => {
    const handleResize = () => {
      setIsOpen(false);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className={cn}>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <EllipsisIcon />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="p-3 mx-1">
        <MenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const HeaderIcons = () => {
  return (
    <>
      <Menu cn="md:hidden" />
      <div className="hidden md:block">
        <MenuItems />
      </div>
    </>
  );
};

export default HeaderIcons;
