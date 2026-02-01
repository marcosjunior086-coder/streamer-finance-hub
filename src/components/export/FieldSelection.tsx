import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ExportOptions } from '@/types/streamer';

interface FieldSelectionProps {
  options: ExportOptions;
  onToggle: (key: keyof ExportOptions) => void;
}

const fields: { key: keyof ExportOptions; label: string }[] = [
  { key: 'includeRanking', label: 'Ranking' },
  { key: 'includeName', label: 'Nome' },
  { key: 'includeId', label: 'ID' },
  { key: 'includeExclusiveGifts', label: 'Exclusivos' },
  { key: 'includeHostUsd', label: 'Host $' },
  { key: 'includeAgencyUsd', label: 'Agência $' },
  { key: 'includeHostCrystals', label: 'Cristais' },
  { key: 'includeLuckGifts', label: 'Sorte' },
  { key: 'includeHours', label: 'Horas' },
  { key: 'includeDays', label: 'Dias' },
];

export function FieldSelection({ options, onToggle }: FieldSelectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map(({ key, label }) => (
        <div key={key} className="flex items-center space-x-2">
          <Checkbox
            id={key}
            checked={options[key]}
            onCheckedChange={() => onToggle(key)}
          />
          <Label htmlFor={key} className="cursor-pointer">{label}</Label>
        </div>
      ))}
    </div>
  );
}
