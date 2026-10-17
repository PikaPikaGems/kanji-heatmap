import type { ReactNode } from "react";
import { Info } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/**
 * One collapsible group of fields, styled like the User Preferences sections
 * (SimpleAccordion). Goes inside the form's `Accordion`.
 */
export const SettingsSection = ({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) => (
  <AccordionItem value={value}>
    <AccordionTrigger className="flex justify-start p-2 space-x-2 text-xl text-left focus:outline-none">
      {title}
    </AccordionTrigger>
    <AccordionContent className="flex flex-col gap-6 px-2 pt-2 pb-6">
      {children}
    </AccordionContent>
  </AccordionItem>
);

/** Small "i" button; tapping it opens a short explanation. */
const InfoTip = ({ title, children }: { title: string; children: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={`About ${title}`}
        className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-4" aria-hidden />
      </button>
    </PopoverTrigger>
    <PopoverContent className="p-3 text-xs w-60">{children}</PopoverContent>
  </Popover>
);

/** Field title with its info tip and, optionally, the current value. */
export const FieldTitle = ({
  title,
  tip,
  value,
}: {
  title: string;
  tip: string;
  value?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
    <span className="flex items-center gap-1.5 text-sm font-semibold">
      {title}
      <InfoTip title={title}>{tip}</InfoTip>
    </span>
    {value !== undefined && (
      <span className="ml-auto text-sm font-bold tabular-nums">{value}</span>
    )}
  </div>
);

/** The lowest and highest values under a slider, like the stroke speeds. */
export const SliderEnds = ({ min, max }: { min: string; max: string }) => (
  <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
    <span>{min}</span>
    <span>{max}</span>
  </div>
);

export const Warning = ({ children }: { children: string }) => (
  <p className={cn("text-xs", cnWarningText)}>{children}</p>
);

/**
 * An engine `invalid_settings` reason, shown next to its field. The engine's
 * reasons start lowercase, so the first letter is capitalized.
 */
export const FieldError = ({ message }: { message: string | undefined }) =>
  message === undefined ? null : (
    <p role="alert" className={cn("text-xs", cnWarningText)}>
      {message.charAt(0).toUpperCase() + message.slice(1)}
    </p>
  );

export const SwitchField = ({
  id,
  title,
  tip,
  checked,
  onCheckedChange,
  error,
}: {
  id: string;
  title: string;
  tip: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5">
        <Label htmlFor={id} className="font-semibold cursor-pointer">
          {title}
        </Label>
        <InfoTip title={title}>{tip}</InfoTip>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
    <FieldError message={error} />
  </div>
);
