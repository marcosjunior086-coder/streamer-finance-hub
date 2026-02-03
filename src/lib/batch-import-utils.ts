import * as XLSX from 'xlsx';

// ===== Types =====
export type ImportMode = 'register' | 'update';
export type UpdateImportType = 'unique' | 'duplicate';

export interface ParsedStreamer {
  name: string;
  streamer_id: string;
  isValid: boolean;
  error?: string;
}

export interface ParsedGiftUpdate {
  streamer_id: string;
  luck_gifts: number;
  exclusive_gifts: number;
  minutes: number;
  isValid: boolean;
  error?: string;
  streamerName?: string; // For display purposes
  daysCount?: number; // For duplicate mode - counts how many entries were consolidated
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// ===== Time Formatting =====
export function formatMinutesToHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// ===== File/URL Parsing =====
export async function parseFileToText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv' || extension === 'txt') {
    return await file.text();
  }
  
  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(firstSheet);
  }
  
  throw new Error('Formato de arquivo não suportado. Use CSV, TXT, XLSX ou XLS.');
}

export async function fetchGoogleSheetsData(url: string): Promise<string> {
  // Extract spreadsheet ID from URL
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /key=([a-zA-Z0-9-_]+)/
  ];
  
  let spreadsheetId: string | null = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      spreadsheetId = match[1];
      break;
    }
  }
  
  if (!spreadsheetId) {
    throw new Error('URL do Google Sheets inválida. Cole o link completo da planilha.');
  }
  
  // Use the public export CSV endpoint
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  
  const response = await fetch(exportUrl);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Planilha não encontrada. Verifique se o link está correto.');
    }
    if (response.status === 403 || response.status === 401) {
      throw new Error('Planilha sem permissão pública. Configure para "Qualquer pessoa com o link pode ver".');
    }
    throw new Error(`Erro ao acessar planilha: ${response.status}`);
  }
  
  return await response.text();
}

// ===== Registration Mode Parsing (Name + ID) =====
export function parseBatchInput(input: string, existingStreamers: { name: string; streamer_id: string }[]): ParsedStreamer[] {
  const lines = input.split('\n').filter(line => line.trim());
  const results: ParsedStreamer[] = [];
  
  // Check if first line looks like a header
  const firstLine = lines[0]?.toLowerCase().trim();
  const isHeader = firstLine && (
    firstLine.includes('nome') || 
    firstLine.includes('name') || 
    firstLine.includes('id') ||
    firstLine === 'nome,id' ||
    firstLine === 'name,id'
  );
  
  const dataLines = isHeader ? lines.slice(1) : lines;
  const existingIds = new Set(existingStreamers.map(s => s.streamer_id));
  const batchIds = new Set<string>();
  
  for (const line of dataLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const parsed = parseRegistrationLine(trimmedLine);
    
    if (parsed) {
      // For registration mode: skip if ID already exists (don't error, just warn)
      if (existingIds.has(parsed.streamer_id)) {
        results.push({
          ...parsed,
          isValid: false,
          error: `ID "${parsed.streamer_id}" já existe - ignorado`
        });
      } else if (batchIds.has(parsed.streamer_id)) {
        results.push({
          ...parsed,
          isValid: false,
          error: 'Duplicado neste lote'
        });
      } else {
        batchIds.add(parsed.streamer_id);
        results.push({
          ...parsed,
          isValid: true
        });
      }
    } else {
      results.push({
        name: trimmedLine.substring(0, 30),
        streamer_id: '',
        isValid: false,
        error: 'Formato inválido'
      });
    }
  }
  
  return results;
}

function parseRegistrationLine(line: string): { name: string; streamer_id: string } | null {
  // Try comma-separated first (CSV format)
  if (line.includes(',')) {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const name = parts[0];
      const id = parts[1];
      if (name && isValidId(id)) {
        return { name, streamer_id: id };
      }
    }
  }
  
  // Try tab-separated
  if (line.includes('\t')) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length >= 2) {
      const name = parts[0];
      const id = parts[1];
      if (name && isValidId(id)) {
        return { name, streamer_id: id };
      }
    }
  }
  
  // Try to find numeric ID at the end (space-separated or emoji-separated)
  const idMatch = line.match(/(\d{5,})$/);
  if (idMatch) {
    const id = idMatch[1];
    let name = line.substring(0, line.length - id.length).trim();
    
    // Clean up trailing separators/emojis/spaces
    name = name.replace(/[\s.,;:\-_🦋💜💙💚💛🧡❤️💕✨⭐🌟]+$/gu, '').trim();
    
    if (name && isValidId(id)) {
      return { name, streamer_id: id };
    }
  }
  
  return null;
}

// ===== Update Mode Parsing (ID + Gifts + Minutes) =====
export function parseGiftUpdateInput(
  input: string, 
  existingStreamers: { name: string; streamer_id: string }[]
): ParsedGiftUpdate[] {
  const lines = input.split('\n').filter(line => line.trim());
  const results: ParsedGiftUpdate[] = [];
  
  // Check if first line looks like a header
  const firstLine = lines[0]?.toLowerCase().trim();
  const isHeader = firstLine && (
    firstLine.includes('id') || 
    firstLine.includes('sorte') ||
    firstLine.includes('exclusivo') ||
    firstLine.includes('minuto') ||
    firstLine.includes('tempo') ||
    firstLine.includes('luck') ||
    firstLine.includes('exclusive')
  );
  
  const dataLines = isHeader ? lines.slice(1) : lines;
  const existingById = new Map(existingStreamers.map(s => [s.streamer_id, s.name]));
  const processedIds = new Set<string>();
  
  for (const line of dataLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const parsed = parseGiftUpdateLine(trimmedLine);
    
    if (parsed) {
      const streamerName = existingById.get(parsed.streamer_id);
      
      if (!streamerName) {
        results.push({
          ...parsed,
          isValid: false,
          error: `ID "${parsed.streamer_id}" não encontrado - ignorado`
        });
      } else if (processedIds.has(parsed.streamer_id)) {
        results.push({
          ...parsed,
          streamerName,
          isValid: false,
          error: 'Duplicado neste lote'
        });
      } else {
        processedIds.add(parsed.streamer_id);
        results.push({
          ...parsed,
          streamerName,
          isValid: true
        });
      }
    } else {
      results.push({
        streamer_id: '',
        luck_gifts: 0,
        exclusive_gifts: 0,
        minutes: 0,
        isValid: false,
        error: 'Formato inválido - esperado: ID, Sorte, Exclusivo, Minutos'
      });
    }
  }
  
  return results;
}

function parseGiftUpdateLine(line: string): { 
  streamer_id: string; 
  luck_gifts: number; 
  exclusive_gifts: number; 
  minutes: number 
} | null {
  let parts: string[] = [];
  
  // Try comma-separated first (CSV format)
  if (line.includes(',')) {
    parts = line.split(',').map(p => p.trim());
  }
  // Try tab-separated
  else if (line.includes('\t')) {
    parts = line.split('\t').map(p => p.trim());
  }
  // Try space-separated (with multiple spaces)
  else {
    parts = line.split(/\s+/).map(p => p.trim());
  }
  
  // Need at least 4 parts: ID, Luck, Exclusive, Minutes
  if (parts.length >= 4) {
    const streamer_id = parts[0];
    const luck_gifts = parseNumber(parts[1]);
    const exclusive_gifts = parseNumber(parts[2]);
    const minutes = parseNumber(parts[3]);
    
    if (isValidId(streamer_id) && !isNaN(luck_gifts) && !isNaN(exclusive_gifts) && !isNaN(minutes)) {
      return { streamer_id, luck_gifts, exclusive_gifts, minutes };
    }
  }
  
  return null;
}

function parseNumber(value: string): number {
  // Remove thousand separators and parse
  const cleaned = value.replace(/[.,]/g, match => match === '.' ? '' : '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? NaN : num;
}

function isValidId(id: string): boolean {
  // ID should be numeric and at least 5 digits
  return /^\d{5,}$/.test(id);
}

// ===== Summary Helpers =====
export function getImportSummary(parsed: ParsedStreamer[] | ParsedGiftUpdate[]): { valid: number; invalid: number } {
  const valid = parsed.filter(p => p.isValid).length;
  const invalid = parsed.filter(p => !p.isValid).length;
  return { valid, invalid };
}

// ===== Consolidation for Duplicate IDs =====
export function consolidateDuplicateIds(parsed: ParsedGiftUpdate[]): ParsedGiftUpdate[] {
  const consolidated = new Map<string, ParsedGiftUpdate>();
  const invalidEntries: ParsedGiftUpdate[] = [];
  
  for (const entry of parsed) {
    // Keep invalid entries as-is for display
    if (!entry.isValid) {
      invalidEntries.push(entry);
      continue;
    }
    
    const existing = consolidated.get(entry.streamer_id);
    if (existing) {
      // Consolidate: sum all values
      consolidated.set(entry.streamer_id, {
        ...existing,
        luck_gifts: existing.luck_gifts + entry.luck_gifts,
        exclusive_gifts: existing.exclusive_gifts + entry.exclusive_gifts,
        minutes: existing.minutes + entry.minutes,
        daysCount: (existing.daysCount || 1) + 1
      });
    } else {
      consolidated.set(entry.streamer_id, {
        ...entry,
        daysCount: 1
      });
    }
  }
  
  // Return consolidated valid entries + invalid entries
  return [...consolidated.values(), ...invalidEntries];
}
