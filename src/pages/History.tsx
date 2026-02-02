import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSnapshots } from '@/hooks/useSnapshots';
import { useStreamers } from '@/hooks/useStreamers';
import { PasswordDialog } from '@/components/PasswordDialog';
import { CreateSnapshotDialog } from '@/components/history/CreateSnapshotDialog';
import { formatNumber, formatCurrency, formatMinutesToHours } from '@/types/streamer';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { History as HistoryIcon, Calendar, Trash2, ChevronDown, ChevronUp, Plus, Lock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

type TabType = 'weekly' | 'monthly' | 'custom';

export default function History() {
  const { snapshots, createSnapshot, deleteSnapshot, isLoading } = useSnapshots();
  const { allStreamers, isLoading: streamersLoading } = useStreamers();
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [deletingSnapshot, setDeletingSnapshot] = useState<{ id: string; label: string } | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter snapshots - weekly and custom tabs show their respective types
  const getFilteredSnapshots = () => {
    if (activeTab === 'weekly') {
      return snapshots.filter(s => s.period_type === 'weekly');
    } else if (activeTab === 'monthly') {
      return snapshots.filter(s => s.period_type === 'monthly');
    } else {
      return snapshots.filter(s => s.period_type === 'custom');
    }
  };

  const filteredSnapshots = getFilteredSnapshots();

  const handleDelete = (id: string, label: string) => {
    setDeletingSnapshot({ id, label });
    setIsPasswordDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingSnapshot) {
      await deleteSnapshot(deletingSnapshot.id);
      setDeletingSnapshot(null);
    }
  };

  const handleCreateSnapshot = async (periodType: 'weekly' | 'monthly' | 'custom', periodLabel: string): Promise<boolean> => {
    return createSnapshot(periodType, periodLabel, allStreamers);
  };

  const getPeriodTypeBadge = (type: string) => {
    switch (type) {
      case 'weekly':
        return <Badge variant="outline" className="text-xs">Semanal</Badge>;
      case 'monthly':
        return <Badge variant="outline" className="text-xs bg-primary/10">Mensal</Badge>;
      case 'custom':
        return <Badge variant="outline" className="text-xs bg-secondary/10">Personalizado</Badge>;
      default:
        return null;
    }
  };

  if (isLoading || streamersLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-bloom">Histórico</h1>
            <p className="text-muted-foreground">
              Históricos fechados por período — base oficial para fechamentos
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
            <Plus className="h-5 w-5 mr-2" />
            Criar Histórico
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Históricos Imutáveis</p>
                <p className="text-sm text-muted-foreground">
                  Os históricos salvos são fechados e não são alterados automaticamente. 
                  Use-os como base oficial para fechamentos mensais e anuais no Dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredSnapshots.length === 0 ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <HistoryIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">Nenhum histórico encontrado</p>
                  <p className="text-sm">Clique em "Criar Histórico" para salvar um snapshot</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSnapshots.map((snapshot) => (
                  <Collapsible
                    key={snapshot.id}
                    open={expandedSnapshot === snapshot.id}
                    onOpenChange={(open) => setExpandedSnapshot(open ? snapshot.id : null)}
                  >
                    <Card className="glass">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{snapshot.period_label}</CardTitle>
                                {getPeriodTypeBadge(snapshot.period_type)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(snapshot.snapshot_date).toLocaleDateString('pt-BR')} • {snapshot.streamer_count} streamers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <p className="text-sm text-muted-foreground">Lucro Agência</p>
                              <p className="text-lg font-bold text-primary">{formatCurrency(snapshot.total_agency_usd)}</p>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                {expandedSnapshot === snapshot.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(snapshot.id, snapshot.period_label)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CollapsibleContent>
                        <CardContent>
                          {/* Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Cristais Host</p>
                              <p className="text-xl font-bold">{formatNumber(snapshot.total_crystals)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">P. Sorte Total</p>
                              <p className="text-xl font-bold">
                                {formatNumber(snapshot.data.reduce((sum, s) => sum + s.luck_gifts, 0))}
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Exclusivos Total</p>
                              <p className="text-xl font-bold">
                                {formatNumber(snapshot.data.reduce((sum, s) => sum + s.exclusive_gifts, 0))}
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Receita Host</p>
                              <p className="text-xl font-bold text-success">{formatCurrency(snapshot.total_host_usd)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Lucro Agência</p>
                              <p className="text-xl font-bold text-primary">{formatCurrency(snapshot.total_agency_usd)}</p>
                            </div>
                          </div>

                          {/* Streamers Table */}
                          <div className="rounded-lg border overflow-auto max-h-96">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead>#</TableHead>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>ID</TableHead>
                                  <TableHead className="text-right">Sorte</TableHead>
                                  <TableHead className="text-right">Exclusivo</TableHead>
                                  <TableHead className="text-right">Cristais</TableHead>
                                  <TableHead className="text-right">Host $</TableHead>
                                  <TableHead className="text-right">Agência $</TableHead>
                                  <TableHead className="text-right">Tempo</TableHead>
                                  <TableHead className="text-right">Dias</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {snapshot.data.map((streamer, index) => (
                                  <TableRow key={streamer.streamer_id}>
                                    <TableCell className="font-medium text-primary">🏆 {index + 1}</TableCell>
                                    <TableCell>{streamer.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{streamer.streamer_id}</TableCell>
                                    <TableCell className="text-right">{formatNumber(streamer.luck_gifts)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(streamer.exclusive_gifts)}</TableCell>
                                    <TableCell className="text-right font-medium text-secondary">{formatNumber(streamer.host_crystals)}</TableCell>
                                    <TableCell className="text-right text-success">{formatCurrency(streamer.host_usd)}</TableCell>
                                    <TableCell className="text-right text-primary">{formatCurrency(streamer.agency_usd)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatMinutesToHours(streamer.minutes)}</TableCell>
                                    <TableCell className="text-right">{streamer.effective_days}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Snapshot Dialog */}
        <CreateSnapshotDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSave={handleCreateSnapshot}
          streamerCount={allStreamers.length}
        />

        {/* Password Dialog for Delete */}
        <PasswordDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          onConfirm={confirmDelete}
          title="Excluir Histórico"
          description={`Tem certeza que deseja excluir o histórico "${deletingSnapshot?.label}"? Esta ação não pode ser desfeita.`}
        />
      </div>
    </MainLayout>
  );
}
