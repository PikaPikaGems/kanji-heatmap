
import { Link } from "@/components/dependent/routing";
import assetsPaths from "@/lib/assets-paths";

export const HeaderTitle = () => {
    return <Link
        to="/"
        className="flex items-center gap-2 py-1.5 hover:opacity-80 transition-opacity"
    >
        <img
            src={assetsPaths.ICON_SVG}
            alt="Kanji Heatmap icon"
            className="h-7 w-7"
        />
        <h1 className="p-0 m-0 text-lg font-bold leading-tight hidden [@media(min-width:321px)]:block ">
            Kanji Heatmap
        </h1>
        <h1 className="p-0 m-0 text-lg font-bold leading-tight block [@media(min-width:320px)]:hidden ">
            KH
        </h1>
    </Link>
}