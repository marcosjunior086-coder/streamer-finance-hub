import { ExportOptions, Streamer } from '@/types/streamer';
import { ExportFormat, formatTextBlock, formatSpreadsheetPreview } from '@/lib/export-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExportPreviewProps {
  streamers: Streamer[];
  options: ExportOptions;
  format: ExportFormat;
  maxItems?: number;
}

export function ExportPreview({ streamers, options, format, maxItems = 5 }: ExportPreviewProps) {
  const displayStreamers = streamers.slice(0, maxItems);
  const hasMore = streamers.length > maxItems;

  if (!streamers.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  if (format === 'text') {
    const textContent = formatTextBlock(displayStreamers, options);
    return (
      <ScrollArea className="h-64">
        <div className="p-4 rounded-lg bg-muted/30 font-mono text-sm whitespace-pre-wrap">
          {textContent}
          {hasMore && (
            <div className="mt-2 text-muted-foreground italic">
              ... e mais {streamers.length - maxItems} streamers
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  const { headers, rows } = formatSpreadsheetPreview(displayStreamers, options);

  return (
    <ScrollArea className="h-64">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, i) => (
                <TableHead key={i} className="whitespace-nowrap font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="whitespace-nowrap">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {hasMore && (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center text-muted-foreground italic">
                  ... e mais {streamers.length - maxItems} streamers
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
