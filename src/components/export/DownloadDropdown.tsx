import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { DownloadFormat } from '@/lib/export-utils';

interface DownloadDropdownProps {
  onDownload: (format: DownloadFormat) => void;
  disabled?: boolean;
}

export function DownloadDropdown({ onDownload, disabled }: DownloadDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex-1" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onDownload('txt')} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Texto (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('pdf')} className="cursor-pointer">
          <File className="h-4 w-4 mr-2" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDownload('xlsx')} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('csv')} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
