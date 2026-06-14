import { Badge } from "../ui/badge";

const FreqCategoryMap: Record<string, string> = {
    "🌱": "basic",
    "☘️": "common",
    "🌷": "fluent",
    "📚": "advanced",
    "🦉": "niche",
    "📖": "textbook"
};

export const FreqTagBadges = ({ tags }: { tags: string[] }) => {
    return <> <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-2">
                {tag} {FreqCategoryMap[tag] ?? "book"}
            </Badge>
        ))}
    </div>
    </>
}