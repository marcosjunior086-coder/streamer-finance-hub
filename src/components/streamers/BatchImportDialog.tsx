import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  parseBatchInput, 
  parseGiftUpdateInput,
  parseFileToText,
  fetchGoogleSheetsData,
  getImportSummary, 
  formatMinutesToHours,
  consolidateDuplicateIds,
  ParsedStreamer,
  ParsedGiftUpdate,
  ImportMode,
  UpdateImportType
} from '@/lib/batch-import-utils';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Link, FileUp, ClipboardPaste, Loader2, Users, CalendarDays } from 'lucide-react';
import { Streamer } from '@/types/streamer';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportRegister: (streamers: { name: string; streamer_id: string; action: 'create' | 'update' }[]) => Promise<{ success: number; failed: number }>;
  onImportUpdate: (updates: { streamer_id: string; luck_gifts: number; exclusive_gifts: number; minutes: number; effective_days?: number }[]) => Promise<{ success: number; failed: number }>;
  existingStreamers: Streamer[];
}

type InputMethod = 'paste' | 'file' | 'sheets';

export function BatchImportDialog({
  open,
  onOpenChange,
  onImportRegister,
  onImportUpdate,
  existingStreamers
}: BatchImportDialogProps) {
  const [mode, setMode] = useState<ImportMode>('register');
  const [updateImportType, setUpdateImportType] = useState<UpdateImportType>('unique');
  const [inputMethod, setInputMethod] = useState<InputMethod>('paste');
  const [rawInput, setRawInput] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse based on mode
  const parsedRegister = useMemo(() => {
    if (mode !== 'register' || !rawInput.trim()) return [];
    return parseBatchInput(rawInput, existingStreamers);
  }, [rawInput, existingStreamers, mode]);

  // Parse for update mode - allow duplicates when in duplicate mode
  const parsedUpdateRaw = useMemo(() => {
    if (mode !== 'update' || !rawInput.trim()) return [];
    // Pass allowDuplicates=true when in duplicate mode so all entries are valid for consolidation
    return parseGiftUpdateInput(rawInput, existingStreamers, updateImportType === 'duplicate');
  }, [rawInput, existingStreamers, mode, updateImportType]);

  const parsedUpdate = useMemo(() => {
    if (updateImportType === 'duplicate') {
      return consolidateDuplicateIds(parsedUpdateRaw);
    }
    return parsedUpdateRaw;
  }, [parsedUpdateRaw, updateImportType]);

  const summaryRegister = useMemo(() => getImportSummary(parsedRegister), [parsedRegister]);
  const summaryUpdate = useMemo(() => getImportSummary(parsedUpdate), [parsedUpdate]);

  const summary = mode === 'register' ? summaryRegister : summaryUpdate;
  const parsed = mode === 'register' ? parsedRegister : parsedUpdate;

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await parseFileToText(file);
      setRawInput(text);
      toast.success(`Arquivo "${file.name}" carregado com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ler arquivo');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Google Sheets URL
  const handleLoadSheets = async () => {
    if (!sheetsUrl.trim()) {
      toast.error('Cole o link do Google Sheets');
      return;
    }

    setIsLoading(true);
    try {
      const text = await fetchGoogleSheetsData(sheetsUrl);
      setRawInput(text);
      toast.success('Dados do Google Sheets carregados!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao acessar planilha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (summary.valid === 0) return;

    setIsImporting(true);
    try {
      let result: { success: number; failed: number };

      if (mode === 'register') {
        const validStreamers = parsedRegister.filter(p => p.isValid && (p.action === 'create' || p.action === 'update')).map(p => ({
          name: p.name,
          streamer_id: p.streamer_id,
          action: p.action as 'create' | 'update'
        }));
        result = await onImportRegister(validStreamers);
      } else {
        const validUpdates = parsedUpdate.filter(p => p.isValid).map(p => ({
          streamer_id: p.streamer_id,
          luck_gifts: p.luck_gifts,
          exclusive_gifts: p.exclusive_gifts,
          minutes: p.minutes,
          // Include effective_days only for duplicate mode (validDaysCount is set during consolidation)
          ...(updateImportType === 'duplicate' && p.validDaysCount !== undefined 
            ? { effective_days: p.validDaysCount } 
            : {})
        }));
        result = await onImportUpdate(validUpdates);
      }

      setImportResult(result);
      
      if (result.success > 0 && result.failed === 0) {
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
    setSheetsUrl('');
    setImportResult(null);
    setMode('register');
    setInputMethod('paste');
    onOpenChange(false);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as ImportMode);
    setRawInput('');
    setSheetsUrl('');
    setImportResult(null);
    setUpdateImportType('unique');
  };

  const handleUpdateTypeChange = (newType: string) => {
    setUpdateImportType(newType as UpdateImportType);
  };

  const showPreview = parsed.length > 0 && !importResult;
  const showResult = importResult !== null;

  const getPlaceholder = () => {
    if (mode === 'register') {
      return `Cole aqui os dados. Exemplos:

Nome,ID
Jubscreuza,10597690
Rô Ramos,10844565

ou

Luh.ᴮˡᵒᵒᵐ🦋10702736
Cat 10587003`;
    }
    return `Cole aqui os dados. Formato:
ID, Sorte, Exclusivo, Minutos

10597690,15000,8000,1500
10844565,12000,6500,1200

ou separado por TAB/espaço`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar em Lote
          </DialogTitle>
          <DialogDescription>
            Importe streamers ou atualize presentes a partir de planilhas.
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
                {importResult.success} {mode === 'register' ? 'streamer' : 'atualização'}{importResult.success !== 1 ? 's' : ''} {mode === 'register' ? 'importado' : 'realizada'}{importResult.success !== 1 ? 's' : ''}
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
            {/* Mode Selection */}
            <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="register">
                  <Upload className="h-4 w-4 mr-2" />
                  Cadastro de Streamers
                </TabsTrigger>
                <TabsTrigger value="update">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Preenchimento de Presentes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="register" className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre streamers com <strong>Nome</strong> e <strong>ID</strong>. Se o ID já existir, o nome será atualizado automaticamente. IDs idênticos com mesmo nome serão ignorados.
                </p>
              </TabsContent>

              <TabsContent value="update" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Atualize presentes do período atual: <strong>ID</strong>, <strong>Sorte</strong>, <strong>Exclusivo</strong>, <strong>Minutos</strong>. IDs não encontrados serão ignorados.
                </p>
                
                {/* Import Type Selection for Update Mode */}
                <div className="rounded-lg border bg-card p-4">
                  <Label className="text-sm font-medium mb-3 block">Tipo de Importação</Label>
                  <RadioGroup 
                    value={updateImportType} 
                    onValueChange={handleUpdateTypeChange}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-start space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="unique" id="unique" className="mt-0.5" />
                      <div className="space-y-1">
                        <Label htmlFor="unique" className="font-medium cursor-pointer flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          IDs Únicos
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Cada ID aparece uma vez. Valores já consolidados.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="duplicate" id="duplicate" className="mt-0.5" />
                      <div className="space-y-1">
                        <Label htmlFor="duplicate" className="font-medium cursor-pointer flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          IDs Duplicados
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mesmo ID várias vezes (dados diários). Sistema consolida automaticamente.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>
            </Tabs>

            {/* Input Method Selection */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={inputMethod === 'paste' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('paste')}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Colar Dados
              </Button>
              <Button
                variant={inputMethod === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('file')}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Upload Arquivo
              </Button>
              <Button
                variant={inputMethod === 'sheets' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMethod('sheets')}
              >
                <Link className="h-4 w-4 mr-2" />
                Google Sheets
              </Button>
            </div>

            <div className="space-y-4 flex-1 min-h-0">
              {/* Input Methods */}
              {inputMethod === 'paste' && (
                <div className="space-y-2">
                  <Label htmlFor="batch-input">Dados</Label>
                  <Textarea
                    id="batch-input"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>
              )}

              {inputMethod === 'file' && (
                <div className="space-y-2">
                  <Label>Upload de Arquivo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isLoading ? (
                        <Loader2 className="h-10 w-10 mx-auto text-muted-foreground animate-spin" />
                      ) : (
                        <FileUp className="h-10 w-10 mx-auto text-muted-foreground" />
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Clique para selecionar ou arraste um arquivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CSV, TXT, XLSX ou XLS
                      </p>
                    </label>
                  </div>
                  {rawInput && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <span className="text-green-600">✓</span> Arquivo carregado - {rawInput.split('\n').length} linhas
                    </div>
                  )}
                </div>
              )}

              {inputMethod === 'sheets' && (
                <div className="space-y-2">
                  <Label>Link do Google Sheets</Label>
                  <div className="flex gap-2">
                    <Input
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1"
                    />
                    <Button onClick={handleLoadSheets} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Carregar'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A planilha deve ter permissão "Qualquer pessoa com o link pode ver"
                  </p>
                  {rawInput && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <span className="text-green-600">✓</span> Dados carregados - {rawInput.split('\n').length} linhas
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
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
                          {summary.invalid} ignorado{summary.invalid !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="h-[200px] border rounded-md">
                    {mode === 'register' ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Status</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Observação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedRegister.map((item, idx) => (
                            <TableRow key={idx} className={!item.isValid ? 'bg-muted/50' : ''}>
                              <TableCell>
                                {item.isValid ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
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
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Status</TableHead>
                            <TableHead>Streamer</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead className="text-right">Sorte</TableHead>
                            <TableHead className="text-right">Exclusivo</TableHead>
                            <TableHead className="text-right">Tempo</TableHead>
                            {updateImportType === 'duplicate' && (
                              <TableHead className="text-center">Dias</TableHead>
                            )}
                            <TableHead>Observação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedUpdate.map((item, idx) => (
                            <TableRow key={idx} className={!item.isValid ? 'bg-muted/50' : ''}>
                              <TableCell>
                                {item.isValid ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{item.streamerName || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{item.streamer_id || '-'}</TableCell>
                              <TableCell className="text-right">{item.luck_gifts.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{item.exclusive_gifts.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatMinutesToHours(item.minutes)}
                              </TableCell>
                              {updateImportType === 'duplicate' && (
                                <TableCell className="text-center">
                                  {item.isValid && item.validDaysCount !== undefined ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.validDaysCount}/{item.daysCount}
                                    </Badge>
                                  ) : '-'}
                                </TableCell>
                              )}
                              <TableCell className="text-sm text-muted-foreground">
                                {item.error || (updateImportType === 'duplicate' && item.daysCount && item.daysCount > 1 
                                  ? `${item.daysCount} registros → ${item.validDaysCount} dias válidos (≥2h)` 
                                  : updateImportType === 'duplicate' && item.isValid
                                    ? (item.validDaysCount === 1 ? '1 dia válido' : '0 dias válidos (< 2h)')
                                    : '-')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
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
                {isImporting ? 'Importando...' : mode === 'register' 
                  ? `Cadastrar ${summary.valid} Streamer${summary.valid !== 1 ? 's' : ''}`
                  : `Atualizar ${summary.valid} Registro${summary.valid !== 1 ? 's' : ''}`
                }
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
