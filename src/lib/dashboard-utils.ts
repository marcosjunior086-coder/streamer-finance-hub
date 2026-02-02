import { Snapshot, StreamerSnapshotData, Streamer, calculateHostUsd, calculateAgencyUsd } from '@/types/streamer';

export interface AggregatedStreamerData {
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

export interface DashboardStats {
  totalCrystals: number;
  totalLuckGifts: number;
  totalExclusiveGifts: number;
  totalHostUsd: number;
  totalAgencyUsd: number;
  streamerCount: number;
  streamers: AggregatedStreamerData[];
}

/**
 * Get dashboard stats from current streamers (real-time/weekly view)
 */
export function getRealtimeStats(streamers: Streamer[]): DashboardStats {
  const aggregated: AggregatedStreamerData[] = streamers.map(s => ({
    streamer_id: s.streamer_id,
    name: s.name,
    luck_gifts: s.luck_gifts,
    exclusive_gifts: s.exclusive_gifts,
    host_crystals: s.host_crystals,
    host_usd: calculateHostUsd(s.host_crystals),
    agency_usd: calculateAgencyUsd(s.host_crystals),
    minutes: s.minutes,
    effective_days: s.effective_days
  }));

  return {
    totalCrystals: streamers.reduce((sum, s) => sum + s.host_crystals, 0),
    totalLuckGifts: streamers.reduce((sum, s) => sum + s.luck_gifts, 0),
    totalExclusiveGifts: streamers.reduce((sum, s) => sum + s.exclusive_gifts, 0),
    totalHostUsd: streamers.reduce((sum, s) => sum + calculateHostUsd(s.host_crystals), 0),
    totalAgencyUsd: streamers.reduce((sum, s) => sum + calculateAgencyUsd(s.host_crystals), 0),
    streamerCount: streamers.length,
    streamers: aggregated
  };
}

/**
 * Aggregate multiple snapshots into combined stats (for monthly/yearly views)
 */
export function aggregateSnapshots(snapshots: Snapshot[]): DashboardStats {
  if (snapshots.length === 0) {
    return {
      totalCrystals: 0,
      totalLuckGifts: 0,
      totalExclusiveGifts: 0,
      totalHostUsd: 0,
      totalAgencyUsd: 0,
      streamerCount: 0,
      streamers: []
    };
  }

  // Aggregate by streamer_id
  const streamerMap = new Map<string, AggregatedStreamerData>();

  for (const snapshot of snapshots) {
    for (const streamer of snapshot.data) {
      const existing = streamerMap.get(streamer.streamer_id);
      
      if (existing) {
        existing.luck_gifts += streamer.luck_gifts;
        existing.exclusive_gifts += streamer.exclusive_gifts;
        existing.host_crystals += streamer.host_crystals;
        existing.host_usd += streamer.host_usd;
        existing.agency_usd += streamer.agency_usd;
        existing.minutes += streamer.minutes;
        existing.effective_days += streamer.effective_days;
      } else {
        streamerMap.set(streamer.streamer_id, {
          streamer_id: streamer.streamer_id,
          name: streamer.name,
          luck_gifts: streamer.luck_gifts,
          exclusive_gifts: streamer.exclusive_gifts,
          host_crystals: streamer.host_crystals,
          host_usd: streamer.host_usd,
          agency_usd: streamer.agency_usd,
          minutes: streamer.minutes,
          effective_days: streamer.effective_days
        });
      }
    }
  }

  const aggregatedStreamers = Array.from(streamerMap.values());

  return {
    totalCrystals: aggregatedStreamers.reduce((sum, s) => sum + s.host_crystals, 0),
    totalLuckGifts: aggregatedStreamers.reduce((sum, s) => sum + s.luck_gifts, 0),
    totalExclusiveGifts: aggregatedStreamers.reduce((sum, s) => sum + s.exclusive_gifts, 0),
    totalHostUsd: aggregatedStreamers.reduce((sum, s) => sum + s.host_usd, 0),
    totalAgencyUsd: aggregatedStreamers.reduce((sum, s) => sum + s.agency_usd, 0),
    streamerCount: aggregatedStreamers.length,
    streamers: aggregatedStreamers
  };
}

/**
 * Get available months from snapshots
 */
export function getAvailableMonths(snapshots: Snapshot[]): { value: string; label: string }[] {
  const months = new Set<string>();
  const monthsMap = new Map<string, string>();
  
  for (const snapshot of snapshots) {
    const date = new Date(snapshot.snapshot_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    months.add(key);
    monthsMap.set(key, label);
  }
  
  return Array.from(months)
    .sort((a, b) => b.localeCompare(a)) // Most recent first
    .map(value => ({ value, label: monthsMap.get(value) || value }));
}

/**
 * Get available years from snapshots
 */
export function getAvailableYears(snapshots: Snapshot[]): { value: string; label: string }[] {
  const years = new Set<string>();
  
  for (const snapshot of snapshots) {
    const date = new Date(snapshot.snapshot_date);
    years.add(String(date.getFullYear()));
  }
  
  return Array.from(years)
    .sort((a, b) => b.localeCompare(a)) // Most recent first
    .map(value => ({ value, label: value }));
}

/**
 * Filter snapshots by month
 */
export function filterSnapshotsByMonth(snapshots: Snapshot[], monthKey: string): Snapshot[] {
  return snapshots.filter(snapshot => {
    const date = new Date(snapshot.snapshot_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return key === monthKey;
  });
}

/**
 * Filter snapshots by year
 */
export function filterSnapshotsByYear(snapshots: Snapshot[], year: string): Snapshot[] {
  return snapshots.filter(snapshot => {
    const date = new Date(snapshot.snapshot_date);
    return String(date.getFullYear()) === year;
  });
}

/**
 * Get monthly growth data for a year (for charts)
 */
export function getMonthlyGrowthData(snapshots: Snapshot[], year: string): { month: string; revenue: number; agency: number }[] {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthData = new Map<number, { revenue: number; agency: number }>();

  const yearSnapshots = filterSnapshotsByYear(snapshots, year);

  for (const snapshot of yearSnapshots) {
    const date = new Date(snapshot.snapshot_date);
    const month = date.getMonth();
    
    const existing = monthData.get(month) || { revenue: 0, agency: 0 };
    existing.revenue += snapshot.total_host_usd;
    existing.agency += snapshot.total_agency_usd;
    monthData.set(month, existing);
  }

  return monthNames.map((name, index) => ({
    month: name,
    revenue: monthData.get(index)?.revenue || 0,
    agency: monthData.get(index)?.agency || 0
  }));
}
