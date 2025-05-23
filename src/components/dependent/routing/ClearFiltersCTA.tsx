import { useSearchParams } from "./routing-hooks";
import { cnTextLink } from "@/lib/generic-cn";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { hasNoFilters } from "@/lib/results-utils";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { Link } from "./router-adapter";
import { ReactNode } from "react";

// Create an url param with only the existing search-text and search-type
// e.g search-text=xxx&search-type=meanings
const useClearedUrl = (): string => {
  const [searchParams] = useSearchParams();

  const searchText = searchParams.get(URL_PARAMS.textSearch.text);
  const searchType = searchParams.get(URL_PARAMS.textSearch.type);

  const hasText = (searchText ?? "").length > 0;
  const hasType = (searchType ?? "").length > 0;
  const textString = hasText
    ? `${URL_PARAMS.textSearch.text}=${searchText}`
    : "";

  const typeString = hasType
    ? `&${URL_PARAMS.textSearch.type}=${searchType}`
    : "";

  const link = `${textString}${typeString}`;
  return encodeURI(link);
};

export const ClearFiltersCTA = ({
  defaultMsg = "Small typo, maybe?",
}: {
  defaultMsg?: ReactNode;
}) => {
  const settings = useSearchSettings();

  const link = useClearedUrl();
  const noFilters = hasNoFilters(settings);

  if (noFilters) {
    return <>{defaultMsg}</>;
  }

  return (
    <>
      Try
      <Link to={`/?${link}`} className={cnTextLink}>
        clearing your filters
      </Link>
      to see more results.
    </>
  );
};
