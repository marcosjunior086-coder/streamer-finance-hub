import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StreamerFormData, formatNumber, parseFormattedNumber } from '@/types/streamer';
import { Streamer } from '@/types/streamer';
import { UserPlus, Save } from 'lucide-react';

interface StreamerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StreamerFormData) => Promise<boolean>;
  editingStreamer?: Streamer | null;
}

const emptyFormData: StreamerFormData = {
  streamer_id: '',
  name: '',
  luck_gifts: '',
  exclusive_gifts: '',
  host_crystals: '',
  minutes: '',
  effective_days: ''
};

export function StreamerFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  editingStreamer 
}: StreamerFormDialogProps) {
  const [formData, setFormData] = useState<StreamerFormData>(emptyFormData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingStreamer) {
      setFormData({
        streamer_id: editingStreamer.streamer_id,
        name: editingStreamer.name,
        luck_gifts: editingStreamer.luck_gifts ? formatNumber(editingStreamer.luck_gifts) : '',
        exclusive_gifts: editingStreamer.exclusive_gifts ? formatNumber(editingStreamer.exclusive_gifts) : '',
        host_crystals: editingStreamer.host_crystals ? formatNumber(editingStreamer.host_crystals) : '',
        minutes: editingStreamer.minutes ? String(editingStreamer.minutes) : '',
        effective_days: editingStreamer.effective_days ? String(editingStreamer.effective_days) : ''
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [editingStreamer, open]);

  const handleChange = (field: keyof StreamerFormData, value: string) => {
    // For numeric fields, allow formatting
    if (['luck_gifts', 'exclusive_gifts', 'host_crystals'].includes(field)) {
      // Remove non-digits, then format
      const numericValue = value.replace(/\D/g, '');
      const formatted = numericValue ? formatNumber(parseInt(numericValue)) : '';
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.streamer_id || !formData.name) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await onSubmit(formData);
      if (success) {
        setFormData(emptyFormData);
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = !!editingStreamer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {isEditing ? 'Editar Streamer' : 'Adicionar Streamer'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os dados do streamer abaixo.' 
              : 'Preencha os dados do novo streamer.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="streamer_id">ID do Streamer *</Label>
              <Input
                id="streamer_id"
                value={formData.streamer_id}
                onChange={(e) => handleChange('streamer_id', e.target.value)}
                placeholder="10597690"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Jubscreuza"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="luck_gifts">Presentes da Sorte</Label>
              <Input
                id="luck_gifts"
                value={formData.luck_gifts}
                onChange={(e) => handleChange('luck_gifts', e.target.value)}
                placeholder="26.153.249"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclusive_gifts">Exclusivos</Label>
              <Input
                id="exclusive_gifts"
                value={formData.exclusive_gifts}
                onChange={(e) => handleChange('exclusive_gifts', e.target.value)}
                placeholder="1.316.516"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="host_crystals">Cristais Host (manual)</Label>
            <Input
              id="host_crystals"
              value={formData.host_crystals}
              onChange={(e) => handleChange('host_crystals', e.target.value)}
              placeholder="500.000"
            />
            <p className="text-xs text-muted-foreground">
              Host USD = Cristais ÷ 10.000 | Agência USD = (Cristais × 10%) ÷ 10.000
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutos</Label>
              <Input
                id="minutes"
                type="number"
                value={formData.minutes}
                onChange={(e) => handleChange('minutes', e.target.value)}
                placeholder="1616"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effective_days">Dias Efetivos (1-31)</Label>
              <Input
                id="effective_days"
                type="number"
                value={formData.effective_days}
                onChange={(e) => handleChange('effective_days', e.target.value)}
                placeholder="7"
                min="1"
                max="31"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
