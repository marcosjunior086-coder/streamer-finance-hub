import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseBatchInput, getImportSummary, ParsedStreamer } from '@/lib/batch-import-utils';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Streamer } from '@/types/streamer';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (streamers: { name: string; streamer_id: string }[]) => Promise<{ success: number; failed: number }>;
  existingStreamers: Streamer[];
}

export function BatchImportDialog({
  open,
  onOpenChange,
  onImport,
  existingStreamers
}: BatchImportDialogProps) {
  const [rawInput, setRawInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const parsed = useMemo(() => {
    if (!rawInput.trim()) return [];
    return parseBatchInput(rawInput, existingStreamers);
  }, [rawInput, existingStreamers]);

  const summary = useMemo(() => getImportSummary(parsed), [parsed]);

  const handleImport = async () => {
    const validStreamers = parsed.filter(p => p.isValid).map(p => ({
      name: p.name,
      streamer_id: p.streamer_id
    }));

    if (validStreamers.length === 0) return;

    setIsImporting(true);
    try {
      const result = await onImport(validStreamers);
      setImportResult(result);
      
      if (result.success > 0 && result.failed === 0) {
        // All successful - close after brief delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setRawInput('');
    setImportResult(null);
    onOpenChange(false);
  };

  const showPreview = parsed.length > 0 && !importResult;
  const showResult = importResult !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Streamers em Lote
          </DialogTitle>
          <DialogDescription>
            Cole os dados de uma planilha ou lista. Formatos aceitos: CSV, tab, ou nome seguido de ID.
          </DialogDescription>
        </DialogHeader>

        {showResult ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            {importResult.failed === 0 ? (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
            )}
            <div className="text-center">
              <p className="text-xl font-semibold">
                {importResult.success} streamer{importResult.success !== 1 ? 's' : ''} importado{importResult.success !== 1 ? 's' : ''}
              </p>
              {importResult.failed > 0 && (
                <p className="text-muted-foreground">
                  {importResult.failed} falha{importResult.failed !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1 min-h-0">
              <div className="space-y-2">
                <Label htmlFor="batch-input">Dados dos Streamers</Label>
                <Textarea
                  id="batch-input"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={`Cole aqui. Exemplos:\n\nJubscreuza,10597690\nRô Ramos,10844565\n\nou\n\nLuh.ᴮˡᵒᵒᵐ🦋10702736\nCat 10587003`}
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>

              {showPreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Prévia ({parsed.length} linha{parsed.length !== 1 ? 's' : ''})</Label>
                    <div className="flex gap-2">
                      <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {summary.valid} válido{summary.valid !== 1 ? 's' : ''}
                      </Badge>
                      {summary.invalid > 0 && (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {summary.invalid} inválido{summary.invalid !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="h-[200px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Status</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Erro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsed.map((item, idx) => (
                          <TableRow key={idx} className={!item.isValid ? 'bg-destructive/5' : ''}>
                            <TableCell>
                              {item.isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.name || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">{item.streamer_id || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.error || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={summary.valid === 0 || isImporting}
                className="gradient-primary"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importando...' : `Importar ${summary.valid} Streamer${summary.valid !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
