import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
  ExportOptions, 
  calculateHostUsd, 
  calculateAgencyUsd, 
  formatNumber, 
  formatCurrency, 
  formatMinutesToHours,
  Streamer
} from '@/types/streamer';

export type ExportFormat = 'text' | 'spreadsheet';
export type DownloadFormat = 'txt' | 'pdf' | 'xlsx' | 'csv';

interface ExportField {
  key: keyof ExportOptions;
  label: string;
  getValue: (streamer: Streamer, index: number) => string;
}

const exportFields: ExportField[] = [
  { key: 'includeRanking', label: 'Ranking', getValue: (s, i) => String(i + 1) },
  { key: 'includeName', label: 'Nome', getValue: (s) => s.name },
  { key: 'includeId', label: 'ID', getValue: (s) => s.streamer_id },
  { key: 'includeExclusiveGifts', label: 'Exclusivos', getValue: (s) => formatNumber(s.exclusive_gifts) },
  { key: 'includeHostUsd', label: 'Host $', getValue: (s) => formatCurrency(calculateHostUsd(s.host_crystals)) },
  { key: 'includeAgencyUsd', label: 'Agência $', getValue: (s) => formatCurrency(calculateAgencyUsd(s.host_crystals)) },
  { key: 'includeHostCrystals', label: 'Cristais', getValue: (s) => formatNumber(s.host_crystals) },
  { key: 'includeLuckGifts', label: 'Sorte', getValue: (s) => formatNumber(s.luck_gifts) },
  { key: 'includeHours', label: 'Horas', getValue: (s) => formatMinutesToHours(s.minutes) },
  { key: 'includeDays', label: 'Dias', getValue: (s) => String(s.effective_days) },
];

export function getActiveFields(options: ExportOptions): ExportField[] {
  return exportFields.filter(field => options[field.key]);
}

export function formatTextBlock(streamers: Streamer[], options: ExportOptions): string {
  const activeFields = getActiveFields(options);
  const lines: string[] = [];

  streamers.forEach((streamer, index) => {
    lines.push(`Streamer: ${streamer.name}`);
    
    activeFields.forEach(field => {
      if (field.key !== 'includeName') {
        lines.push(`${field.label}: ${field.getValue(streamer, index)}`);
      }
    });
    
    lines.push('------------------------');
  });

  return lines.join('\n');
}

export function formatSpreadsheetPreview(streamers: Streamer[], options: ExportOptions): { headers: string[], rows: string[][] } {
  const activeFields = getActiveFields(options);
  const headers = activeFields.map(f => f.label);
  const rows = streamers.map((streamer, index) => 
    activeFields.map(field => field.getValue(streamer, index))
  );

  return { headers, rows };
}

export function downloadTxt(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPdf(content: string, filename: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  
  doc.setFont('helvetica');
  doc.setFontSize(10);
  
  const lines = content.split('\n');
  let y = 20;
  const lineHeight = 6;
  const pageHeight = doc.internal.pageSize.getHeight();
  
  lines.forEach(line => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    
    if (line.startsWith('Streamer:')) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
    } else if (line === '------------------------') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      y += 4;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }
    
    const splitLines = doc.splitTextToSize(line, maxWidth);
    splitLines.forEach((splitLine: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitLine, margin, y);
      y += lineHeight;
    });
  });
  
  doc.save(`${filename}.pdf`);
}

export function downloadXlsx(streamers: Streamer[], options: ExportOptions, filename: string): void {
  const { headers, rows } = formatSpreadsheetPreview(streamers, options);
  const data = [headers, ...rows];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 30) };
  });
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Streamers');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function downloadCsv(streamers: Streamer[], options: ExportOptions, filename: string): void {
  const { headers, rows } = formatSpreadsheetPreview(streamers, options);
  const data = [headers, ...rows];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
