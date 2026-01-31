import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StreamersTable } from '@/components/streamers/StreamersTable';
import { StreamerFormDialog } from '@/components/streamers/StreamerFormDialog';
import { PasswordDialog } from '@/components/PasswordDialog';
import { useStreamers } from '@/hooks/useStreamers';
import { Streamer, StreamerFormData } from '@/types/streamer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, Users, Trash2 } from 'lucide-react';

export default function Streamers() {
  const {
    streamers,
    allStreamers,
    isLoading,
    sortField,
    sortDirection,
    searchQuery,
    setSearchQuery,
    handleSort,
    addStreamer,
    updateStreamer,
    deleteStreamer,
    clearMonthlyData
  } = useStreamers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [deletingStreamer, setDeletingStreamer] = useState<Streamer | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

  const handleAdd = () => {
    setEditingStreamer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (streamer: Streamer) => {
    setEditingStreamer(streamer);
    setIsFormOpen(true);
  };

  const handleDelete = (streamer: Streamer) => {
    setDeletingStreamer(streamer);
    setIsPasswordDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingStreamer) {
      await deleteStreamer(deletingStreamer.id);
      setDeletingStreamer(null);
    }
  };

  const confirmClearMonthlyData = async () => {
    await clearMonthlyData();
  };

  const handleFormSubmit = async (data: StreamerFormData): Promise<boolean> => {
    if (editingStreamer) {
      return updateStreamer(editingStreamer.id, data);
    }
    return addStreamer(data);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-bloom">Streamers</h1>
            <p className="text-muted-foreground">
              Gerencie os streamers da agência
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsClearDataDialogOpen(true)} 
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Limpar dados do mês
            </Button>
            <Button onClick={handleAdd} className="gradient-primary">
              <UserPlus className="h-5 w-5 mr-2" />
              Adicionar Streamer
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Total de Streamers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-bloom">{allStreamers.length}</p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou ID..."
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card className="glass">
          <CardContent className="pt-6">
            <StreamersTable
              streamers={streamers}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <StreamerFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          editingStreamer={editingStreamer}
        />

        {/* Password Dialog for Delete */}
        <PasswordDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          onConfirm={confirmDelete}
          title="Excluir Streamer"
          description={`Tem certeza que deseja excluir "${deletingStreamer?.name}"? Esta ação não pode ser desfeita.`}
        />

        {/* Password Dialog for Clear Monthly Data */}
        <PasswordDialog
          open={isClearDataDialogOpen}
          onOpenChange={setIsClearDataDialogOpen}
          onConfirm={confirmClearMonthlyData}
          title="Limpar Dados do Mês"
          description="Isso irá zerar Sorte, Exclusivos, Cristais, Horas e Dias de TODOS os streamers. Nome e ID serão mantidos. Esta ação não pode ser desfeita."
        />
      </div>
    </MainLayout>
  );
}
