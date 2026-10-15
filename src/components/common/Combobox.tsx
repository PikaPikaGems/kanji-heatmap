"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { CheckCircle, ChevronsUpDown } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Combobox<T>({
  value,
  setValue,
  options,
  emptyMsg = "No match found.",
  searchMsg = "Search..",
}: {
  value: T;
  setValue: (x: T) => void;
  options: { value: T; label: string; description?: string }[];
  emptyMsg?: string;
  searchMsg?: string;
}) {
  const [open, setOpen] = React.useState(false);

  // modal=true is needed here so that itemscroll (mousewheel can scroll inside dialog box)
  // see also: https://github.com/shadcn-ui/ui/issues/4759#issuecomment-2413167640
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-ellipsis text-left p-2 whitespace-nowrap"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : "-"}
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchMsg} />
          <CommandList>
            <CommandEmpty>{emptyMsg}</CommandEmpty>
            <CommandGroup className="py-0">
              {options.map((option) => (
                <CommandItem
                  key={option.value as string}
                  value={option.value as string}
                  onSelect={(currentValue) => {
                    const newVal = currentValue as T;
                    setValue(newVal);
                    setOpen(false);
                  }}
                  className="block py-2 text-left border-b-2 border-dotted"
                >
                  <span className="flex font-extrabold py-0 my-0 font-lg">
                    {option.label}
                    <CheckCircle
                      className={cn(
                        "ml-2 h-4 w-4 py-0 my-0 text-green-500",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </span>
                  {option.description && (
                    <span className="block text-xs w-96">
                      {option.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
