import { ExportOptions, Streamer } from '@/types/streamer';
import { ExportFormat, formatTextBlock, formatSpreadsheetPreview } from '@/lib/export-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileBarChart } from 'lucide-react';

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

  if (format === 'report') {
    const { headers, rows } = formatSpreadsheetPreview(displayStreamers, options);
    return (
      <ScrollArea className="h-64">
        <div className="rounded-lg border bg-white text-black p-4">
          {/* Simulated PDF header */}
          <div className="flex flex-col items-center mb-4 pb-3 border-b border-gray-200">
            <img 
              src="/bloom-agency-logo.png" 
              alt="Bloom Agency" 
              className="h-12 mb-2"
            />
            <h2 className="text-base font-bold text-gray-800">Relatório de Streamers</h2>
            <p className="text-xs text-gray-500">Prévia do relatório PDF</p>
          </div>
          
          {/* Table preview */}
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                {headers.map((header, i) => (
                  <TableHead key={i} className="whitespace-nowrap font-bold text-white text-center text-xs py-2">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => {
                    const header = headers[j];
                    const isText = ['Nome', 'ID'].includes(header);
                    const isCenter = header === 'Ranking';
                    return (
                      <TableCell 
                        key={j} 
                        className={`whitespace-nowrap text-xs py-2 ${
                          isText ? 'text-left' : isCenter ? 'text-center' : 'text-right'
                        }`}
                      >
                        {cell}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {hasMore && (
                <TableRow>
                  <TableCell colSpan={headers.length} className="text-center text-gray-500 italic text-xs">
                    ... e mais {streamers.length - maxItems} streamers
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Footer preview */}
          <div className="mt-4 pt-2 border-t border-gray-200 flex justify-between text-xs text-gray-400">
            <span>Bloom Agency</span>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Spreadsheet format
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
