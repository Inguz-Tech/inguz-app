import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { differenceInDays } from 'date-fns';

interface GraphDataPoint {
  period: string;
  sent: number;
  received: number;
}

export const useGraphData = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['graph-data', startDate, endDate],
    queryFn: async (): Promise<GraphDataPoint[]> => {
      const daysDiff = differenceInDays(endDate, startDate);
      const truncType = daysDiff <= 2 ? 'hour' : 'day';

      const { data, error } = await supabase.rpc('get_messages_graph_data', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        trunc_type: truncType,
      });

      if (error) {
        console.error('Error fetching graph data:', error);
        return [];
      }

      return data || [];
    },
  });
};
