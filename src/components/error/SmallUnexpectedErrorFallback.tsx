import { outLinks } from "@/lib/external-links";
import { ExternalTextLink } from "../common/ExternalTextLink";

export const SmallUnexpectedErrorFallback = () => {
  return (
    <div className="flex items-center justify-center w-full h-full p-2 text-xs font-bold">
      <div>
        すみません 🙇🏽‍♀️ 🙇. <br /> Report error on
        <ExternalTextLink text="Discord." href={outLinks.discord} />
      </div>
    </div>
  );
};


export const SmallUnexpectedErrorFallbackTxt = ({ txt }: { txt: string }) => {
  return (
    <div className="flex items-center justify-center w-full h-full p-2 text-xs font-bold">
      <div>
        すみません 🙇🏽‍♀️ 🙇. <br /> {txt}
      </div>
    </div>
  );
};
