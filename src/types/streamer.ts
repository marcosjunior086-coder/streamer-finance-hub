export interface Streamer {
  id: string;
  streamer_id: string;
  name: string;
  luck_gifts: number;
  exclusive_gifts: number;
  host_crystals: number;
  minutes: number;
  effective_days: number;
  created_at: string;
  updated_at: string;
}

export interface StreamerFormData {
  streamer_id: string;
  name: string;
  luck_gifts: string;
  exclusive_gifts: string;
  host_crystals: string;
  minutes: string;
  effective_days: string;
}

export interface Snapshot {
  id: string;
  period_type: 'weekly' | 'monthly' | 'yearly';
  period_label: string;
  snapshot_date: string;
  data: StreamerSnapshotData[];
  total_crystals: number;
  total_host_usd: number;
  total_agency_usd: number;
  streamer_count: number;
  created_at: string;
}

export interface StreamerSnapshotData {
  streamer_id: string;
  name: string;
  luck_gifts: number;
  exclusive_gifts: number;
  host_crystals: number;
  host_usd: number;
  agency_usd: number;
  minutes: number;
  effective_days: number;
}

export type SortField = 
  | 'name' 
  | 'streamer_id' 
  | 'luck_gifts' 
  | 'exclusive_gifts' 
  | 'host_crystals' 
  | 'host_usd' 
  | 'agency_usd' 
  | 'minutes' 
  | 'effective_days';

export type SortDirection = 'asc' | 'desc';

export interface ExportOptions {
  includeRanking: boolean;
  includeName: boolean;
  includeId: boolean;
  includeLuckGifts: boolean;
  includeExclusiveGifts: boolean;
  includeHostCrystals: boolean;
  includeHostUsd: boolean;
  includeAgencyUsd: boolean;
  includeHours: boolean;
  includeDays: boolean;
}

// Utility functions for calculations
export function calculateHostUsd(hostCrystals: number): number {
  return hostCrystals / 10000;
}

export function calculateAgencyUsd(hostCrystals: number): number {
  return (hostCrystals * 0.1) / 10000;
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function parseFormattedNumber(str: string): number {
  if (!str) return 0;
  // Remove all non-numeric characters except minus sign
  const cleaned = str.replace(/[^\d-]/g, '');
  return parseInt(cleaned, 10) || 0;
}
