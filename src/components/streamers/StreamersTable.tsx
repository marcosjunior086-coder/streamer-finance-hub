import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Streamer, 
  SortField, 
  SortDirection, 
  calculateHostUsd, 
  calculateAgencyUsd, 
  formatMinutesToHours, 
  formatNumber, 
  formatCurrency 
} from '@/types/streamer';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StreamersTableProps {
  streamers: Streamer[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (streamer: Streamer) => void;
  onDelete: (streamer: Streamer) => void;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 20;

export function StreamersTable({ 
  streamers, 
  sortField, 
  sortDirection, 
  onSort, 
  onEdit, 
  onDelete,
  isLoading 
}: StreamersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(streamers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStreamers = streamers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const copyStreamerData = (streamer: Streamer, index: number) => {
    const hostUsd = calculateHostUsd(streamer.host_crystals);
    const agencyUsd = calculateAgencyUsd(streamer.host_crystals);
    const hours = formatMinutesToHours(streamer.minutes);
    
    const text = `🏆 ${index + 1} ${streamer.name} ${streamer.streamer_id} ${formatNumber(streamer.luck_gifts)} ${formatNumber(streamer.exclusive_gifts)} ${formatNumber(streamer.host_crystals)} ${formatCurrency(hostUsd)} ${formatCurrency(agencyUsd)} ${hours} ${streamer.effective_days}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Dados copiados!');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (streamers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">Nenhum streamer cadastrado</p>
        <p className="text-sm">Clique em "Adicionar Streamer" para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">#</TableHead>
              <SortableHeader field="name">Nome</SortableHeader>
              <SortableHeader field="streamer_id">ID</SortableHeader>
              <SortableHeader field="luck_gifts" className="text-right">Sorte</SortableHeader>
              <SortableHeader field="exclusive_gifts" className="text-right">Exclusivo</SortableHeader>
              <SortableHeader field="host_crystals" className="text-right">Cristais</SortableHeader>
              <SortableHeader field="host_usd" className="text-right">Host $</SortableHeader>
              <SortableHeader field="agency_usd" className="text-right">Agência $</SortableHeader>
              <SortableHeader field="minutes" className="text-right">Horas</SortableHeader>
              <SortableHeader field="effective_days" className="text-right">Dias</SortableHeader>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStreamers.map((streamer, index) => {
              const globalIndex = startIndex + index;
              const hostUsd = calculateHostUsd(streamer.host_crystals);
              const agencyUsd = calculateAgencyUsd(streamer.host_crystals);
              const hours = formatMinutesToHours(streamer.minutes);

              return (
                <TableRow key={streamer.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-primary">
                    🏆 {globalIndex + 1}
                  </TableCell>
                  <TableCell className="font-medium">{streamer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{streamer.streamer_id}</TableCell>
                  <TableCell className="text-right">{formatNumber(streamer.luck_gifts)}</TableCell>
                  <TableCell className="text-right">{formatNumber(streamer.exclusive_gifts)}</TableCell>
                  <TableCell className="text-right font-medium text-secondary">{formatNumber(streamer.host_crystals)}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(hostUsd)}</TableCell>
                  <TableCell className="text-right text-primary">{formatCurrency(agencyUsd)}</TableCell>
                  <TableCell className="text-right">{hours}</TableCell>
                  <TableCell className="text-right">{streamer.effective_days}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyStreamerData(streamer, globalIndex)}
                        title="Copiar dados"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(streamer)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(streamer)}
                        className="text-destructive hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, streamers.length)} de {streamers.length} streamers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
