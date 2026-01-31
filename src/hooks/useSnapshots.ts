import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Snapshot, Streamer, StreamerSnapshotData, calculateHostUsd, calculateAgencyUsd } from '@/types/streamer';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export function useSnapshots() {
  const { sessionToken } = useAuth();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSnapshots = useCallback(async () => {
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api', {
        body: { resource: 'snapshots', action: 'list' },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      // Transform the data to match our Snapshot interface
      const transformedData: Snapshot[] = (data?.data || []).map((item: any) => ({
        ...item,
        period_type: item.period_type as 'weekly' | 'monthly' | 'yearly',
        data: item.data as unknown as StreamerSnapshotData[]
      }));

      setSnapshots(transformedData);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const createSnapshot = async (
    periodType: 'weekly' | 'monthly' | 'yearly',
    periodLabel: string,
    streamers: Streamer[]
  ): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return false;
    }

    try {
      // Check for existing snapshot with same period in local data
      const existing = snapshots.find(
        s => s.period_type === periodType && s.period_label === periodLabel
      );

      if (existing) {
        toast.error(`Já existe um snapshot para ${periodLabel}`);
        return false;
      }

      const snapshotData: StreamerSnapshotData[] = streamers.map(s => ({
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

      const totalCrystals = streamers.reduce((sum, s) => sum + s.host_crystals, 0);
      const totalHostUsd = streamers.reduce((sum, s) => sum + calculateHostUsd(s.host_crystals), 0);
      const totalAgencyUsd = streamers.reduce((sum, s) => sum + calculateAgencyUsd(s.host_crystals), 0);

      const insertData = {
        period_type: periodType,
        period_label: periodLabel,
        snapshot_date: new Date().toISOString().split('T')[0],
        data: snapshotData as unknown as Json,
        total_crystals: totalCrystals,
        total_host_usd: totalHostUsd,
        total_agency_usd: totalAgencyUsd,
        streamer_count: streamers.length
      };

      const { data, error } = await supabase.functions.invoke('api', {
        body: { resource: 'snapshots', action: 'create', data: insertData },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      toast.success(`Snapshot "${periodLabel}" salvo com sucesso!`);
      await fetchSnapshots();
      return true;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      toast.error('Erro ao salvar snapshot');
      return false;
    }
  };

  const deleteSnapshot = async (id: string): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api', {
        body: { resource: 'snapshots', action: 'delete', id },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      toast.success('Snapshot excluído com sucesso!');
      await fetchSnapshots();
      return true;
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      toast.error('Erro ao excluir snapshot');
      return false;
    }
  };

  const getSnapshotsByPeriod = (periodType: 'weekly' | 'monthly' | 'yearly') => {
    return snapshots.filter(s => s.period_type === periodType);
  };

  return {
    snapshots,
    isLoading,
    createSnapshot,
    deleteSnapshot,
    getSnapshotsByPeriod,
    refetch: fetchSnapshots
  };
}
