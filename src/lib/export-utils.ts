import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export type ExportFormat = 'text' | 'spreadsheet' | 'report';
export type DownloadFormat = 'txt' | 'pdf' | 'xlsx' | 'csv' | 'pdf-report';
export type PdfOrientation = 'portrait' | 'landscape';

interface ExportField {
  key: keyof ExportOptions;
  label: string;
  getValue: (streamer: Streamer, index: number) => string;
}

const exportFields: ExportField[] = [
  { key: 'includeRanking', label: 'Ranking', getValue: (s, i) => String(i + 1) },
  { key: 'includeName', label: 'Nome', getValue: (s) => s.name },
  { key: 'includeId', label: 'ID', getValue: (s) => s.streamer_id },
  { key: 'includeLuckGifts', label: 'Sorte', getValue: (s) => formatNumber(s.luck_gifts) },
  { key: 'includeExclusiveGifts', label: 'Exclusivos', getValue: (s) => formatNumber(s.exclusive_gifts) },
  { key: 'includeHostCrystals', label: 'Cristais', getValue: (s) => formatNumber(s.host_crystals) },
  { key: 'includeHostUsd', label: 'Host $', getValue: (s) => formatCurrency(calculateHostUsd(s.host_crystals)) },
  { key: 'includeAgencyUsd', label: 'Agência $', getValue: (s) => formatCurrency(calculateAgencyUsd(s.host_crystals)) },
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
  // Use BOM for UTF-8 to ensure proper encoding of special characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/plain;charset=utf-8' });
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
  
  // Use BOM for UTF-8 to ensure proper encoding of emojis and special characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPdfReport(
  streamers: Streamer[], 
  options: ExportOptions, 
  filename: string,
  periodLabel?: string,
  orientation: PdfOrientation = 'landscape'
): Promise<void> {
  const { headers, rows } = formatSpreadsheetPreview(streamers, options);
  
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Load and add logo
  try {
    const logoImg = await loadImage('/bloom-agency-logo.png');
    const logoHeight = 20;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 8;
  } catch (error) {
    // If logo fails to load, just continue without it
    console.warn('Could not load logo:', error);
  }

  // Title (use safe ASCII for PDF fonts)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatorio de Streamers', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Period label if provided
  if (periodLabel) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // Sanitize period label for PDF compatibility
    const sanitizedPeriodLabel = sanitizeTextForPdfLight(periodLabel);
    doc.text(`Periodo: ${sanitizedPeriodLabel}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
  }

  // Generation date
  doc.setFontSize(9);
  doc.setTextColor(100);
  const generatedAt = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  // Sanitize date (remove accents from month names)
  const sanitizedDate = sanitizeTextForPdfLight(generatedAt);
  doc.text(`Gerado em: ${sanitizedDate}`, pageWidth / 2, currentY, { align: 'center' });
  doc.setTextColor(0);
  currentY += 10;

  // Determine column alignments based on field type
  const columnStyles: { [key: number]: { halign: 'left' | 'center' | 'right' } } = {};
  headers.forEach((header, index) => {
    if (['Nome', 'ID'].includes(header)) {
      columnStyles[index] = { halign: 'left' };
    } else if (['Ranking'].includes(header)) {
      columnStyles[index] = { halign: 'center' };
    } else {
      columnStyles[index] = { halign: 'right' };
    }
  });

  // Sanitize text for PDF - preserve as much as possible, only remove unsupported chars
  const sanitizedHeaders = headers.map(h => sanitizeTextForPdfLight(h));
  const sanitizedRows = rows.map(row => row.map(cell => sanitizeTextForPdfLight(cell)));

  // Generate table
  autoTable(doc, {
    head: [sanitizedHeaders],
    body: sanitizedRows,
    startY: currentY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [255, 47, 146], // Primary pink color
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles,
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    didDrawPage: (data) => {
      // Footer with page numbers
      const pageNumber = doc.getCurrentPageInfo().pageNumber;
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Pagina ${pageNumber} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'Bloom Agency',
        margin,
        pageHeight - 10
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// Light sanitization for PDF - only remove characters that cause rendering issues
// Preserves accented characters since Helvetica supports Latin-1
function sanitizeTextForPdfLight(text: string): string {
  if (!text) return '';
  
  // Only remove emoji characters that can't be rendered by standard PDF fonts
  let sanitized = text
    // Remove emoji characters
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    // Remove zero-width and variation selectors
    .replace(/[\u{200D}]/gu, '')
    .replace(/[\u{20E3}]/gu, '')
    .replace(/[\u{E0020}-\u{E007F}]/gu, '')
    // Remove other problematic unicode ranges
    .replace(/[\u{2000}-\u{206F}]/gu, ' ') // General punctuation (replace with space)
    .replace(/[\u{FFF0}-\u{FFFF}]/gu, ''); // Specials
  
  // Clean up multiple spaces and trim
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

// For basic PDF text export (not tabular) - more aggressive sanitization
function sanitizeTextForPdf(text: string): string {
  if (!text) return '';
  
  let sanitized = sanitizeTextForPdfLight(text);
  
  // For non-table content, also normalize accents for better compatibility
  const accentMap: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n',
    'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
    'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C', 'Ñ': 'N'
  };
  
  sanitized = sanitized.split('').map(char => accentMap[char] || char).join('');
  
  return sanitized;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
