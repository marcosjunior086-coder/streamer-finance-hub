import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Streamer, StreamerFormData, SortField, SortDirection, parseFormattedNumber } from '@/types/streamer';
import { toast } from 'sonner';

export function useStreamers() {
  const { sessionToken } = useAuth();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('host_crystals');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStreamers = useCallback(async () => {
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api', {
        body: { resource: 'streamers', action: 'list' },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      // Sort locally based on current sort settings
      const sortedData = [...(data?.data || [])].sort((a, b) => {
        const aValue = a[sortField] || 0;
        const bValue = b[sortField] || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });

      setStreamers(sortedData);
    } catch (error) {
      console.error('Error fetching streamers:', error);
      toast.error('Erro ao carregar streamers');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, sortField, sortDirection]);

  useEffect(() => {
    fetchStreamers();
  }, [fetchStreamers]);

  const addStreamer = async (formData: StreamerFormData): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return false;
    }

    try {
      // Check for duplicates by searching in local data first
      const existing = streamers.find(
        s => s.streamer_id === formData.streamer_id || s.name === formData.name
      );

      if (existing) {
        toast.error('Já existe um streamer com este ID ou Nome');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('api', {
        body: {
          resource: 'streamers',
          action: 'create',
          data: {
            streamer_id: formData.streamer_id,
            name: formData.name,
            luck_gifts: parseFormattedNumber(formData.luck_gifts),
            exclusive_gifts: parseFormattedNumber(formData.exclusive_gifts),
            host_crystals: parseFormattedNumber(formData.host_crystals),
            minutes: parseFormattedNumber(formData.minutes),
            effective_days: parseInt(formData.effective_days) || 0
          }
        },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      toast.success('Streamer adicionado com sucesso!');
      await fetchStreamers();
      return true;
    } catch (error) {
      console.error('Error adding streamer:', error);
      toast.error('Erro ao adicionar streamer');
      return false;
    }
  };

  const updateStreamer = async (id: string, formData: StreamerFormData): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return false;
    }

    try {
      // Check for duplicates (excluding current)
      const existing = streamers.find(
        s => s.id !== id && (s.streamer_id === formData.streamer_id || s.name === formData.name)
      );

      if (existing) {
        toast.error('Já existe outro streamer com este ID ou Nome');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('api', {
        body: {
          resource: 'streamers',
          action: 'update',
          id,
          data: {
            streamer_id: formData.streamer_id,
            name: formData.name,
            luck_gifts: parseFormattedNumber(formData.luck_gifts),
            exclusive_gifts: parseFormattedNumber(formData.exclusive_gifts),
            host_crystals: parseFormattedNumber(formData.host_crystals),
            minutes: parseFormattedNumber(formData.minutes),
            effective_days: parseInt(formData.effective_days) || 0
          }
        },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      toast.success('Streamer atualizado com sucesso!');
      await fetchStreamers();
      return true;
    } catch (error) {
      console.error('Error updating streamer:', error);
      toast.error('Erro ao atualizar streamer');
      return false;
    }
  };

  const deleteStreamer = async (id: string): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api', {
        body: { resource: 'streamers', action: 'delete', id },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      toast.success('Streamer excluído com sucesso!');
      await fetchStreamers();
      return true;
    } catch (error) {
      console.error('Error deleting streamer:', error);
      toast.error('Erro ao excluir streamer');
      return false;
    }
  };

  const addStreamersBatch = async (streamers: { name: string; streamer_id: string }[]): Promise<{ success: number; failed: number }> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return { success: 0, failed: streamers.length };
    }

    let success = 0;
    let failed = 0;

    for (const streamer of streamers) {
      try {
        const { error } = await supabase.functions.invoke('api', {
          body: {
            resource: 'streamers',
            action: 'create',
            data: {
              streamer_id: streamer.streamer_id,
              name: streamer.name,
              luck_gifts: 0,
              exclusive_gifts: 0,
              host_crystals: 0,
              minutes: 0,
              effective_days: 0
            }
          },
          headers: { 'x-session-token': sessionToken }
        });

        if (error) {
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error('Error adding streamer in batch:', error);
        failed++;
      }
    }

    if (success > 0) {
      toast.success(`${success} streamer${success !== 1 ? 's' : ''} cadastrado${success !== 1 ? 's' : ''} com sucesso!`);
      await fetchStreamers();
    }

    if (failed > 0) {
      toast.error(`${failed} falha${failed !== 1 ? 's' : ''} no cadastro`);
    }

    return { success, failed };
  };

  const updateStreamersBatch = async (updates: { streamer_id: string; luck_gifts: number; exclusive_gifts: number; minutes: number }[]): Promise<{ success: number; failed: number }> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return { success: 0, failed: updates.length };
    }

    let success = 0;
    let failed = 0;

    for (const update of updates) {
      try {
        // Find the streamer by streamer_id
        const existingStreamer = streamers.find(s => s.streamer_id === update.streamer_id);
        if (!existingStreamer) {
          failed++;
          continue;
        }

        const { error } = await supabase.functions.invoke('api', {
          body: {
            resource: 'streamers',
            action: 'update',
            id: existingStreamer.id,
            data: {
              luck_gifts: update.luck_gifts,
              exclusive_gifts: update.exclusive_gifts,
              minutes: update.minutes
            }
          },
          headers: { 'x-session-token': sessionToken }
        });

        if (error) {
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error('Error updating streamer in batch:', error);
        failed++;
      }
    }

    if (success > 0) {
      toast.success(`${success} registro${success !== 1 ? 's' : ''} atualizado${success !== 1 ? 's' : ''} com sucesso!`);
      await fetchStreamers();
    }

    if (failed > 0) {
      toast.error(`${failed} falha${failed !== 1 ? 's' : ''} na atualização`);
    }

    return { success, failed };
  };

  const clearMonthlyData = async (): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Sessão inválida');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api', {
        body: { resource: 'streamers', action: 'clear-monthly' },
        headers: { 'x-session-token': sessionToken }
      });

      if (error) throw error;

      toast.success('Dados do mês limpos com sucesso!');
      await fetchStreamers();
      return true;
    } catch (error) {
      console.error('Error clearing monthly data:', error);
      toast.error('Erro ao limpar dados do mês');
      return false;
    }
  };

  const filteredStreamers = streamers.filter(streamer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      streamer.name.toLowerCase().includes(query) ||
      streamer.streamer_id.toLowerCase().includes(query)
    );
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return {
    streamers: filteredStreamers,
    allStreamers: streamers,
    isLoading,
    sortField,
    sortDirection,
    searchQuery,
    setSearchQuery,
    handleSort,
    addStreamer,
    updateStreamer,
    deleteStreamer,
    addStreamersBatch,
    updateStreamersBatch,
    clearMonthlyData,
    refetch: fetchStreamers
  };
}
