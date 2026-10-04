import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const VocabularyTableHeader = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="text-left w-fit">Speak</TableHead>
      <TableHead className="text-center w-fit">Word</TableHead>
      <TableHead className="text-center w-fit">Reading</TableHead>
      <TableHead className="w-48 text-center">English Gloss</TableHead>
      <TableHead className="w-48 text-center">Tags</TableHead>
      <TableHead className="w-24 text-left">Jotoba.de</TableHead>
      <TableHead className="w-24 text-left">KanjiAPI.dev</TableHead>
      <TableHead className="w-24 text-left">Jisho.org</TableHead>
    </TableRow>
  </TableHeader>
);
