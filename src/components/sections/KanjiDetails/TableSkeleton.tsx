import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Placeholder table shown while a vocabulary JSON is loading. */
export const TableSkeleton = () => {
  const [show, setShow] = useState(false);
  // Effect needed: timer delaying the skeleton reveal (avoids a flash on
  // fast loads), cleared on unmount.
  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timeout);
  }, []);

  if (!show) {
    return <div className="h-[800px]"></div>;
  }

  return (
    <div className="px-2 mx-2 overflow-x-auto mt-14 animate pulse">
      <Table className="w-full min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-fit">Speak</TableHead>
            <TableHead className="text-center w-fit">Word</TableHead>
            <TableHead className="text-center w-fit">Reading</TableHead>
            <TableHead className="w-12 text-center">Translation</TableHead>
            <TableHead className="text-center w-fit min-w-16 max-w-24">
              Tags
            </TableHead>
            <TableHead className="w-24 text-left">Jisho.org</TableHead>
            <TableHead className="w-24 text-left">Jotoba.de</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="w-12">
                <div className="w-8 h-8 rounded-xl bg-muted" />
              </TableCell>
              <TableCell className="w-fit">
                <div className="w-24 h-12 rounded-full bg-muted" />
              </TableCell>
              <TableCell className="text-left">
                <div className="h-5 rounded-full bg-muted w-36" />
              </TableCell>
              <TableCell className="w-fit">
                <div className="w-24 h-12 rounded-full bg-muted" />
              </TableCell>
              <TableCell className="w-full">
                <div className="w-full h-5 rounded-full bg-muted" />
              </TableCell>
              <TableCell className="w-12">
                <div className="w-8 h-8 rounded-xl bg-muted" />
              </TableCell>
              <TableCell className="w-12">
                <div className="w-8 h-8 rounded-xl bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
