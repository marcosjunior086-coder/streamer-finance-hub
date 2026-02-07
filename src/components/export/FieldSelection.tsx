import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExportOptions } from '@/types/streamer';
import { ArrowUp, ArrowDown, Lock } from 'lucide-react';

interface FieldSelectionProps {
  options: ExportOptions;
  onToggle: (key: keyof ExportOptions) => void;
  fieldOrder: (keyof ExportOptions)[];
  onReorder: (newOrder: (keyof ExportOptions)[]) => void;
}

const fieldLabels: Record<keyof ExportOptions, string> = {
  includeRanking: 'Ranking',
  includeName: 'Nome',
  includeId: 'ID',
  includeLuckGifts: 'Sorte',
  includeExclusiveGifts: 'Exclusivos',
  includeHostCrystals: 'Cristais',
  includeHostUsd: 'Host $',
  includeAgencyUsd: 'Agência $',
  includeMinutes: 'Minutos',
  includeHours: 'Horas',
  includeDays: 'Dias',
};

export function FieldSelection({ options, onToggle, fieldOrder, onReorder }: FieldSelectionProps) {
  const moveField = (index: number, direction: 'up' | 'down') => {
    if (index === 0) return; // Ranking can't move
    
    const newOrder = [...fieldOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Can't move above Ranking (position 0) or below last
    if (targetIndex < 1 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onReorder(newOrder);
  };

  return (
    <div className="space-y-1">
      {fieldOrder.map((key, index) => {
        const isRanking = key === 'includeRanking';
        const isLast = index === fieldOrder.length - 1;
        
        return (
          <div 
            key={key} 
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={key}
              checked={options[key]}
              onCheckedChange={() => onToggle(key)}
            />
            <Label htmlFor={key} className="cursor-pointer flex-1 text-sm">
              {fieldLabels[key]}
            </Label>
            {!isRanking ? (
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveField(index, 'up')}
                  disabled={index <= 1}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveField(index, 'down')}
                  disabled={isLast}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}
