import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Save, Loader2 } from 'lucide-react';

interface CreateSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (periodType: 'weekly' | 'monthly' | 'custom', periodLabel: string) => Promise<boolean>;
  streamerCount: number;
}

export function CreateSnapshotDialog({
  open,
  onOpenChange,
  onSave,
  streamerCount
}: CreateSnapshotDialogProps) {
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [customLabel, setCustomLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const now = new Date();
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();
  const weekNum = Math.ceil(now.getDate() / 7);

  const getDefaultLabel = () => {
    switch (periodType) {
      case 'weekly':
        return `Semana ${weekNum} – ${currentMonth} ${currentYear}`;
      case 'monthly':
        return `${currentMonth} ${currentYear}`;
      case 'custom':
        return customLabel;
    }
  };

  const handleSave = async () => {
    const label = periodType === 'custom' ? customLabel : getDefaultLabel();
    
    if (!label.trim()) {
      return;
    }

    setIsSaving(true);
    const success = await onSave(periodType, label);
    setIsSaving(false);
    
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setPeriodType('weekly');
    setCustomLabel('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Criar Histórico
          </DialogTitle>
          <DialogDescription>
            Salve um snapshot fechado com os dados atuais de {streamerCount} streamer{streamerCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Tipo de Período</Label>
            <RadioGroup value={periodType} onValueChange={(v) => setPeriodType(v as 'weekly' | 'monthly' | 'custom')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">
                  Semanal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">
                  Mensal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Período Personalizado
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-label">Identificação do Período</Label>
            {periodType === 'custom' ? (
              <Input
                id="period-label"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Ex: Quinzena 1 – Fevereiro 2026"
              />
            ) : (
              <Input
                id="period-label"
                value={getDefaultLabel()}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>O histórico será salvo com todos os dados atuais dos streamers e não poderá ser alterado automaticamente.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (periodType === 'custom' && !customLabel.trim()) || streamerCount === 0}
            className="gradient-primary"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Histórico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
