import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSnapshots } from '@/hooks/useSnapshots';
import { PasswordDialog } from '@/components/PasswordDialog';
import { formatNumber, formatCurrency, formatMinutesToHours } from '@/types/streamer';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { History as HistoryIcon, Calendar, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function History() {
  const { snapshots, deleteSnapshot, isLoading } = useSnapshots();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [deletingSnapshot, setDeletingSnapshot] = useState<{ id: string; label: string } | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const filteredSnapshots = snapshots.filter(s => s.period_type === activeTab);

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
          <h1 className="text-3xl font-bold text-bloom">Histórico</h1>
          <p className="text-muted-foreground">
            Consulte os snapshots salvos por período
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'weekly' | 'monthly' | 'yearly')}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="yearly">Anual</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredSnapshots.length === 0 ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <HistoryIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">Nenhum snapshot encontrado</p>
                  <p className="text-sm">Salve um snapshot no Dashboard para começar</p>
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
                              <CardTitle className="text-lg">{snapshot.period_label}</CardTitle>
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Cristais Totais</p>
                              <p className="text-xl font-bold">{formatNumber(snapshot.total_crystals)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Receita Host</p>
                              <p className="text-xl font-bold text-success">{formatCurrency(snapshot.total_host_usd)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Lucro Agência</p>
                              <p className="text-xl font-bold text-primary">{formatCurrency(snapshot.total_agency_usd)}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">Streamers</p>
                              <p className="text-xl font-bold">{snapshot.streamer_count}</p>
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
                                  <TableHead className="text-right">Horas</TableHead>
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
                                    <TableCell className="text-right">{formatMinutesToHours(streamer.minutes)}</TableCell>
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

        {/* Password Dialog for Delete */}
        <PasswordDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          onConfirm={confirmDelete}
          title="Excluir Snapshot"
          description={`Tem certeza que deseja excluir o snapshot "${deletingSnapshot?.label}"? Esta ação não pode ser desfeita.`}
        />
      </div>
    </MainLayout>
  );
}
