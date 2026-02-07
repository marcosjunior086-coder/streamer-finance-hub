import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SortDirection } from '@/types/streamer';

export type ExportSortField = 'none' | 'name' | 'luck_gifts' | 'exclusive_gifts' | 'host_crystals' | 'host_usd' | 'agency_usd' | 'minutes' | 'effective_days';

interface SortControlsProps {
  sortField: ExportSortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: ExportSortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}

const sortFieldOptions = [
  { value: 'none', label: 'Sem ordenação' },
  { value: 'luck_gifts', label: 'Presente da Sorte' },
  { value: 'exclusive_gifts', label: 'Presente Exclusivo' },
  { value: 'host_crystals', label: 'Cristais' },
  { value: 'host_usd', label: 'Host $' },
  { value: 'agency_usd', label: 'Agência $' },
  { value: 'minutes', label: 'Minutos' },
  { value: 'effective_days', label: 'Dias' },
  { value: 'name', label: 'Nome' },
];

export function SortControls({ sortField, sortDirection, onSortFieldChange, onSortDirectionChange }: SortControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ordenar por</Label>
        <Select value={sortField} onValueChange={(v) => onSortFieldChange(v as ExportSortField)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortFieldOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {sortField !== 'none' && (
        <RadioGroup
          value={sortDirection}
          onValueChange={(v) => onSortDirectionChange(v as SortDirection)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="desc" id="sort-desc" />
            <Label htmlFor="sort-desc" className="cursor-pointer text-sm">
              Maior → Menor
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="asc" id="sort-asc" />
            <Label htmlFor="sort-asc" className="cursor-pointer text-sm">
              Menor → Maior
            </Label>
          </div>
        </RadioGroup>
      )}
    </div>
  );
}
