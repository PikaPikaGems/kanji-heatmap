import { outLinks } from "@/lib/external-links"
import { Badge } from "../ui/badge"

export const PikaPikaLinks = () => {
    return <div className="flex flex-wrap justify-center w-full gap-2 text-xs font-bold">
        <a href={outLinks.ririkku} target="_blank" rel="noreferrer"><Badge >🎤 Ririkku</Badge></a>
        <a href={outLinks.jpWordRanks} target="_blank" rel="noreferrer"><Badge >🦉 JP Word Ranks</Badge></a>
    </div>
}