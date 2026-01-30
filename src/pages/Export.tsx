import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStreamers } from '@/hooks/useStreamers';
import { useSnapshots } from '@/hooks/useSnapshots';
import { 
  ExportOptions, 
  calculateHostUsd, 
  calculateAgencyUsd, 
  formatNumber, 
  formatCurrency, 
  formatMinutesToHours,
  Streamer
} from '@/types/streamer';
import { Download, Copy, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

const defaultExportOptions: ExportOptions = {
  includeRanking: true,
  includeName: true,
  includeId: true,
  includeLuckGifts: true,
  includeExclusiveGifts: true,
  includeHostCrystals: true,
  includeHostUsd: true,
  includeAgencyUsd: true,
  includeHours: true,
  includeDays: true
};

export default function Export() {
  const { allStreamers, isLoading: streamersLoading } = useStreamers();
  const { snapshots, isLoading: snapshotsLoading } = useSnapshots();
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [exportSource, setExportSource] = useState<'current' | 'snapshot'>('current');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [selectedStreamer, setSelectedStreamer] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const toggleOption = (key: keyof ExportOptions) => {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getDataToExport = (): Streamer[] | null => {
    if (exportSource === 'current') {
      if (selectedStreamer === 'all') {
        return allStreamers;
      }
      const streamer = allStreamers.find(s => s.id === selectedStreamer);
      return streamer ? [streamer] : null;
    } else {
      const snapshot = snapshots.find(s => s.id === selectedSnapshot);
      if (!snapshot) return null;
      
      // Convert snapshot data to Streamer format
      return snapshot.data.map(s => ({
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
  };

  const formatExportData = (streamers: Streamer[]): string => {
    const lines: string[] = [];

    streamers.forEach((streamer, index) => {
      const parts: string[] = [];
      
      if (exportOptions.includeRanking) parts.push(`🏆 ${index + 1}`);
      if (exportOptions.includeName) parts.push(streamer.name);
      if (exportOptions.includeId) parts.push(streamer.streamer_id);
      if (exportOptions.includeLuckGifts) parts.push(formatNumber(streamer.luck_gifts));
      if (exportOptions.includeExclusiveGifts) parts.push(formatNumber(streamer.exclusive_gifts));
      if (exportOptions.includeHostCrystals) parts.push(formatNumber(streamer.host_crystals));
      if (exportOptions.includeHostUsd) parts.push(formatCurrency(calculateHostUsd(streamer.host_crystals)));
      if (exportOptions.includeAgencyUsd) parts.push(formatCurrency(calculateAgencyUsd(streamer.host_crystals)));
      if (exportOptions.includeHours) parts.push(formatMinutesToHours(streamer.minutes));
      if (exportOptions.includeDays) parts.push(String(streamer.effective_days));

      lines.push(parts.join(' '));
    });

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const data = getDataToExport();
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const text = formatExportData(data);
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Dados copiados para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar dados');
    }
  };

  const handleDownload = () => {
    const data = getDataToExport();
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const text = formatExportData(data);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamers_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Arquivo baixado com sucesso!');
  };

  const isLoading = streamersLoading || snapshotsLoading;

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
            Exporte dados de streamers em formato pronto para WhatsApp, Excel ou Docs
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

          {/* Field Selection */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Campos para Exportar</CardTitle>
              <CardDescription>
                Selecione os campos que deseja incluir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ranking" 
                    checked={exportOptions.includeRanking}
                    onCheckedChange={() => toggleOption('includeRanking')}
                  />
                  <Label htmlFor="ranking">Ranking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="name" 
                    checked={exportOptions.includeName}
                    onCheckedChange={() => toggleOption('includeName')}
                  />
                  <Label htmlFor="name">Nome</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="id" 
                    checked={exportOptions.includeId}
                    onCheckedChange={() => toggleOption('includeId')}
                  />
                  <Label htmlFor="id">ID</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="luck" 
                    checked={exportOptions.includeLuckGifts}
                    onCheckedChange={() => toggleOption('includeLuckGifts')}
                  />
                  <Label htmlFor="luck">Sorte</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exclusive" 
                    checked={exportOptions.includeExclusiveGifts}
                    onCheckedChange={() => toggleOption('includeExclusiveGifts')}
                  />
                  <Label htmlFor="exclusive">Exclusivos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="crystals" 
                    checked={exportOptions.includeHostCrystals}
                    onCheckedChange={() => toggleOption('includeHostCrystals')}
                  />
                  <Label htmlFor="crystals">Cristais</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hostUsd" 
                    checked={exportOptions.includeHostUsd}
                    onCheckedChange={() => toggleOption('includeHostUsd')}
                  />
                  <Label htmlFor="hostUsd">Host $</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agencyUsd" 
                    checked={exportOptions.includeAgencyUsd}
                    onCheckedChange={() => toggleOption('includeAgencyUsd')}
                  />
                  <Label htmlFor="agencyUsd">Agência $</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hours" 
                    checked={exportOptions.includeHours}
                    onCheckedChange={() => toggleOption('includeHours')}
                  />
                  <Label htmlFor="hours">Horas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="days" 
                    checked={exportOptions.includeDays}
                    onCheckedChange={() => toggleOption('includeDays')}
                  />
                  <Label htmlFor="days">Dias</Label>
                </div>
              </div>
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
            <div className="p-4 rounded-lg bg-muted/30 font-mono text-sm max-h-64 overflow-auto whitespace-pre-wrap">
              {(() => {
                const data = getDataToExport();
                if (!data || data.length === 0) return 'Nenhum dado disponível';
                return formatExportData(data.slice(0, 5)) + (data.length > 5 ? '\n...' : '');
              })()}
            </div>

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
                    Copiar
                  </>
                )}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar TXT
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
