import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { VocabularyTableHeader } from "./VocabularyTableHeader";

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
        <VocabularyTableHeader />
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
