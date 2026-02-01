export interface ParsedStreamer {
  name: string;
  streamer_id: string;
  isValid: boolean;
  error?: string;
}

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Parse raw text input and extract streamer name/ID pairs
 * Supports multiple formats:
 * - CSV: Name,ID
 * - Tab-separated: Name\tID
 * - Space-separated: Name ID (ID must be numeric)
 * - Combined format: Name.ID or Name🦋ID (with emoji/symbol separators)
 */
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
  
  for (const line of dataLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const parsed = parseLine(trimmedLine);
    
    if (parsed) {
      // Check for duplicates in existing data
      const existingByName = existingStreamers.find(s => s.name === parsed.name);
      const existingById = existingStreamers.find(s => s.streamer_id === parsed.streamer_id);
      
      // Check for duplicates in current batch
      const duplicateInBatch = results.find(r => r.name === parsed.name || r.streamer_id === parsed.streamer_id);
      
      if (existingByName) {
        results.push({
          ...parsed,
          isValid: false,
          error: `Nome "${parsed.name}" já existe`
        });
      } else if (existingById) {
        results.push({
          ...parsed,
          isValid: false,
          error: `ID "${parsed.streamer_id}" já existe`
        });
      } else if (duplicateInBatch) {
        results.push({
          ...parsed,
          isValid: false,
          error: 'Duplicado neste lote'
        });
      } else {
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

function parseLine(line: string): { name: string; streamer_id: string } | null {
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
  // Pattern: "Name ID" or "Name🦋ID" or "Name.ˢᵘᵖᵉʳˢᶜʳⁱᵖᵗID"
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

function isValidId(id: string): boolean {
  // ID should be numeric and at least 5 digits
  return /^\d{5,}$/.test(id);
}

export function getImportSummary(parsed: ParsedStreamer[]): { valid: number; invalid: number } {
  const valid = parsed.filter(p => p.isValid).length;
  const invalid = parsed.filter(p => !p.isValid).length;
  return { valid, invalid };
}
