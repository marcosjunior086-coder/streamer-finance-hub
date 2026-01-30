import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Streamer, StreamerFormData, SortField, SortDirection, parseFormattedNumber } from '@/types/streamer';
import { toast } from 'sonner';

export function useStreamers() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('host_crystals');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStreamers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('streamers')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      setStreamers(data || []);
    } catch (error) {
      console.error('Error fetching streamers:', error);
      toast.error('Erro ao carregar streamers');
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortDirection]);

  useEffect(() => {
    fetchStreamers();
  }, [fetchStreamers]);

  const addStreamer = async (formData: StreamerFormData): Promise<boolean> => {
    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('streamers')
        .select('id')
        .or(`streamer_id.eq.${formData.streamer_id},name.eq.${formData.name}`)
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error('Já existe um streamer com este ID ou Nome');
        return false;
      }

      const { error } = await supabase.from('streamers').insert({
        streamer_id: formData.streamer_id,
        name: formData.name,
        luck_gifts: parseFormattedNumber(formData.luck_gifts),
        exclusive_gifts: parseFormattedNumber(formData.exclusive_gifts),
        host_crystals: parseFormattedNumber(formData.host_crystals),
        minutes: parseFormattedNumber(formData.minutes),
        effective_days: parseInt(formData.effective_days) || 0
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
    try {
      // Check for duplicates (excluding current streamer)
      const { data: existing } = await supabase
        .from('streamers')
        .select('id')
        .or(`streamer_id.eq.${formData.streamer_id},name.eq.${formData.name}`)
        .neq('id', id)
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error('Já existe outro streamer com este ID ou Nome');
        return false;
      }

      const { error } = await supabase
        .from('streamers')
        .update({
          streamer_id: formData.streamer_id,
          name: formData.name,
          luck_gifts: parseFormattedNumber(formData.luck_gifts),
          exclusive_gifts: parseFormattedNumber(formData.exclusive_gifts),
          host_crystals: parseFormattedNumber(formData.host_crystals),
          minutes: parseFormattedNumber(formData.minutes),
          effective_days: parseInt(formData.effective_days) || 0
        })
        .eq('id', id);

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
    try {
      const { error } = await supabase.from('streamers').delete().eq('id', id);

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
    refetch: fetchStreamers
  };
}
