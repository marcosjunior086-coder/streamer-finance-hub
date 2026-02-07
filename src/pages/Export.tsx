import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useStreamers } from '@/hooks/useStreamers';
import { useSnapshots } from '@/hooks/useSnapshots';
import { ExportOptions, Streamer, SortDirection, calculateHostUsd, calculateAgencyUsd } from '@/types/streamer';
import { Copy, FileText, Check, Table2, FileType, FileBarChart, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { ExportPreview } from '@/components/export/ExportPreview';
import { DownloadDropdown } from '@/components/export/DownloadDropdown';
import { FieldSelection } from '@/components/export/FieldSelection';
import { SortControls, ExportSortField } from '@/components/export/SortControls';
import {
  ExportFormat,
  DownloadFormat,
  PdfOrientation,
  formatTextBlock,
  downloadTxt,
  downloadPdf,
  downloadXlsx,
  downloadCsv,
  downloadPdfReport,
} from '@/lib/export-utils';

const defaultExportOptions: ExportOptions = {
  includeRanking: true,
  includeName: true,
  includeId: true,
  includeLuckGifts: true,
  includeExclusiveGifts: true,
  includeHostCrystals: true,
  includeHostUsd: true,
  includeAgencyUsd: true,
  includeMinutes: true,
  includeHours: true,
  includeDays: true
};

const defaultFieldOrder: (keyof ExportOptions)[] = [
  'includeRanking',
  'includeName',
  'includeId',
  'includeLuckGifts',
  'includeExclusiveGifts',
  'includeHostCrystals',
  'includeHostUsd',
  'includeAgencyUsd',
  'includeMinutes',
  'includeHours',
  'includeDays',
];

export default function Export() {
  const { allStreamers, isLoading: streamersLoading } = useStreamers();
  const { snapshots, isLoading: snapshotsLoading } = useSnapshots();
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [fieldOrder, setFieldOrder] = useState<(keyof ExportOptions)[]>(defaultFieldOrder);
  const [exportSource, setExportSource] = useState<'current' | 'snapshot'>('current');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [selectedStreamer, setSelectedStreamer] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('text');
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('landscape');
  const [sortField, setSortField] = useState<ExportSortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copied, setCopied] = useState(false);

  const toggleOption = (key: keyof ExportOptions) => {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sortStreamers = (data: Streamer[]): Streamer[] => {
    if (sortField === 'none') return data;
    
    return [...data].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortField) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'host_usd':
          aVal = calculateHostUsd(a.host_crystals);
          bVal = calculateHostUsd(b.host_crystals);
          break;
        case 'agency_usd':
          aVal = calculateAgencyUsd(a.host_crystals);
          bVal = calculateAgencyUsd(b.host_crystals);
          break;
        default:
          aVal = a[sortField] || 0;
          bVal = b[sortField] || 0;
      }
      
      let comparison: number;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = (aVal as number) - (bVal as number);
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };

  const getDataToExport = (): Streamer[] | null => {
    let data: Streamer[] | null = null;

    if (exportSource === 'current') {
      if (selectedStreamer === 'all') {
        data = allStreamers;
      } else {
        const streamer = allStreamers.find(s => s.id === selectedStreamer);
        data = streamer ? [streamer] : null;
      }
    } else {
      const snapshot = snapshots.find(s => s.id === selectedSnapshot);
      if (!snapshot) return null;
      
      data = snapshot.data.map(s => ({
        id: s.streamer_id,
        streamer_id: s.streamer_id,
        name: s.name,
        luck_gifts: s.luck_gifts,
        exclusive_gifts: s.exclusive_gifts,
        host_crystals: s.host_crystals,
        minutes: s.minutes,
        effective_days: s.effective_days,
        created_at: '',
        updated_at: ''
      }));
    }

    if (data) {
      data = sortStreamers(data);
    }

    return data;
  };

  const handleCopy = async () => {
    const data = getDataToExport();
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const text = formatTextBlock(data, exportOptions, fieldOrder);
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Dados copiados para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar dados');
    }
  };

  const getPeriodLabel = (): string | undefined => {
    if (exportSource === 'snapshot') {
      const snapshot = snapshots.find(s => s.id === selectedSnapshot);
      return snapshot?.period_label;
    }
    return undefined;
  };

  const handleDownload = async (format: DownloadFormat) => {
    const data = getDataToExport();
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const filename = `streamers_${new Date().toISOString().split('T')[0]}`;

    try {
      switch (format) {
        case 'txt':
          downloadTxt(formatTextBlock(data, exportOptions, fieldOrder), filename);
          break;
        case 'pdf':
          downloadPdf(formatTextBlock(data, exportOptions, fieldOrder), filename);
          break;
        case 'xlsx':
          downloadXlsx(data, exportOptions, filename, fieldOrder);
          break;
        case 'csv':
          downloadCsv(data, exportOptions, filename, fieldOrder);
          break;
        case 'pdf-report':
          await downloadPdfReport(data, exportOptions, filename, getPeriodLabel(), pdfOrientation, fieldOrder);
          break;
      }
      toast.success(`Arquivo ${format === 'pdf-report' ? 'PDF Relatório' : format.toUpperCase()} baixado com sucesso!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const isLoading = streamersLoading || snapshotsLoading;
  const dataToExport = getDataToExport();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-bloom">Exportar</h1>
          <p className="text-muted-foreground">
            Exporte dados em formato texto ou planilha para WhatsApp, Excel, Google Sheets e mais
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Selection */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Fonte dos Dados
              </CardTitle>
              <CardDescription>
                Escolha de onde exportar os dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={exportSource} onValueChange={(v) => setExportSource(v as 'current' | 'snapshot')}>
                <TabsList className="w-full">
                  <TabsTrigger value="current" className="flex-1">Dados Atuais</TabsTrigger>
                  <TabsTrigger value="snapshot" className="flex-1">Snapshot</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="mt-4">
                  <div className="space-y-2">
                    <Label>Streamer</Label>
                    <Select value={selectedStreamer} onValueChange={setSelectedStreamer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os streamers</SelectItem>
                        {allStreamers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="snapshot" className="mt-4">
                  <div className="space-y-2">
                    <Label>Snapshot</Label>
                    <Select value={selectedSnapshot} onValueChange={setSelectedSnapshot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um snapshot..." />
                      </SelectTrigger>
                      <SelectContent>
                        {snapshots.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.period_label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Field Selection & Column Order */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Campos e Ordem das Colunas</CardTitle>
              <CardDescription>
                Selecione e reorganize os campos para exportação. Ranking permanece fixo na primeira posição.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSelection 
                options={exportOptions} 
                onToggle={toggleOption}
                fieldOrder={fieldOrder}
                onReorder={setFieldOrder}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sort & Format Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sort Controls */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                Classificação
              </CardTitle>
              <CardDescription>
                Ordene os dados antes de exportar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SortControls
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={setSortField}
                onSortDirectionChange={setSortDirection}
              />
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileType className="h-5 w-5 text-primary" />
                Formato de Visualização
              </CardTitle>
              <CardDescription>
                Escolha como visualizar a prévia dos dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={exportFormat}
                onValueChange={(v) => setExportFormat(v as ExportFormat)}
                className="flex flex-wrap gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="format-text" />
                  <Label htmlFor="format-text" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Texto
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spreadsheet" id="format-spreadsheet" />
                  <Label htmlFor="format-spreadsheet" className="flex items-center gap-2 cursor-pointer">
                    <Table2 className="h-4 w-4" />
                    Planilha
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="report" id="format-report" />
                  <Label htmlFor="format-report" className="flex items-center gap-2 cursor-pointer">
                    <FileBarChart className="h-4 w-4" />
                    Relatório PDF
                  </Label>
                </div>
              </RadioGroup>

              {exportFormat === 'report' && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium mb-3 block">Orientação do PDF</Label>
                  <RadioGroup
                    value={pdfOrientation}
                    onValueChange={(v) => setPdfOrientation(v as PdfOrientation)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="orientation-landscape" />
                      <Label htmlFor="orientation-landscape" className="cursor-pointer">
                        Paisagem
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="portrait" id="orientation-portrait" />
                      <Label htmlFor="orientation-portrait" className="cursor-pointer">
                        Retrato
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Prévia</CardTitle>
            <CardDescription>
              Visualize como os dados serão exportados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExportPreview
              streamers={dataToExport || []}
              options={exportOptions}
              format={exportFormat}
              fieldOrder={fieldOrder}
            />

            <div className="flex gap-4">
              <Button onClick={handleCopy} className="flex-1 gradient-primary">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Texto
                  </>
                )}
              </Button>
              <DownloadDropdown 
                onDownload={handleDownload} 
                disabled={!dataToExport || dataToExport.length === 0}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
