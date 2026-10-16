import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

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
      <span className="ml-auto text-sm font-semibold tabular-nums">
        {value}
      </span>
    )}
  </div>
);

export const Warning = ({ children }: { children: string }) => (
  <p className="text-xs text-amber-600 dark:text-amber-400">{children}</p>
);

/** An engine `invalid_settings` reason, shown next to its field. */
export const FieldError = ({ message }: { message: string | undefined }) =>
  message === undefined ? null : (
    <p
      role="alert"
      className="text-xs font-bold text-yellow-600 dark:text-yellow-400"
    >
      {message}
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
        <Label htmlFor={id} className="font-semibold">
          {title}
        </Label>
        <InfoTip title={title}>{tip}</InfoTip>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
    <FieldError message={error} />
  </div>
);
