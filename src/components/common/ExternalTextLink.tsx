import { cnTextLink } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

export const ExternalTextLink = ({
  href,
  text,
  className,
}: {
  href: string;
  text: string;
  className?: string;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(cnTextLink, "whitespace-nowrap", className)}
    >
      {text}
    </a>
  );
};
