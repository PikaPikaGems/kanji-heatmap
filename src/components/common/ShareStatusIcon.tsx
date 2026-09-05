import { CheckCircle, Share2 } from "@/components/icons";

export const ShareStatusIcon = ({
  copied,
  className,
}: {
  copied: boolean;
  className?: string;
}) =>
  copied ? (
    <CheckCircle className={className} />
  ) : (
    <Share2 className={className} />
  );
