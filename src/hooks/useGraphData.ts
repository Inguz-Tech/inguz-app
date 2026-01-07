import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { differenceInDays, differenceInHours, addDays, addHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GraphDataPoint {
  period: string;
  sent: number;
  received: number;
}

// Generate all periods between start and end dates
const generateAllPeriods = (startDate: Date, endDate: Date, truncType: 'hour' | 'day'): string[] => {
  const periods: string[] = [];
  
  if (truncType === 'hour') {
    const totalHours = differenceInHours(endDate, startDate);
    for (let i = 0; i <= totalHours; i++) {
      const date = addHours(startDate, i);
      periods.push(format(date, 'dd/MM HH:00', { locale: ptBR }));
    }
  } else {
    const totalDays = differenceInDays(endDate, startDate);
    for (let i = 0; i <= totalDays; i++) {
      const date = addDays(startDate, i);
      periods.push(format(date, 'dd/MM', { locale: ptBR }));
    }
  }
  
  return periods;
};

export const useGraphData = (tenantId: string | undefined, startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['graph-data', tenantId, startDate, endDate],
    queryFn: async (): Promise<GraphDataPoint[]> => {
      const daysDiff = differenceInDays(endDate, startDate);
      const truncType = daysDiff <= 2 ? 'hour' : 'day';
      
      // Generate all periods for the date range
      const allPeriods = generateAllPeriods(startDate, endDate, truncType);
      
      // Initialize all periods with zero values
      const periodMap = new Map<string, GraphDataPoint>();
      allPeriods.forEach(period => {
        periodMap.set(period, { period, sent: 0, received: 0 });
      });

      if (!tenantId) {
        return Array.from(periodMap.values());
      }

      const { data, error } = await supabase.rpc('get_messages_graph_data', {
        p_tenant_id: tenantId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        trunc_type: truncType,
      });

      if (error) {
        throw new Error(`Erro ao buscar dados do gráfico: ${error.message}`);
      }

      // Merge database data with generated periods
      if (data && Array.isArray(data)) {
        data.forEach((item: GraphDataPoint) => {
          if (periodMap.has(item.period)) {
            periodMap.set(item.period, {
              period: item.period,
              sent: item.sent || 0,
              received: item.received || 0,
            });
          }
        });
      }

      return Array.from(periodMap.values());
    },
    enabled: true, // Always enabled to show empty graph
  });
};
