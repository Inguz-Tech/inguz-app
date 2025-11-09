import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { differenceInDays } from 'date-fns';

interface DashboardMetrics {
  totalConversations: number;
  messagesSent: number;
  messagesReceived: number;
}

export const useDashboardMetrics = (tenantId: string | undefined, startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['dashboard-metrics', tenantId, startDate, endDate],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!tenantId) {
        return {
          totalConversations: 0,
          messagesSent: 0,
          messagesReceived: 0,
        };
      }

      const daysBack = differenceInDays(endDate, startDate);

      const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        p_tenant_id: tenantId,
        p_days_back: daysBack,
      });

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        return {
          totalConversations: 0,
          messagesSent: 0,
          messagesReceived: 0,
        };
      }

      // A função RPC retorna um array, pegar o primeiro elemento
      const result = Array.isArray(data) ? data[0] : data;

      return {
        totalConversations: result?.total_conversations || 0,
        messagesSent: result?.messages_sent || 0,
        messagesReceived: result?.messages_received || 0,
      };
    },
    enabled: !!tenantId,
  });
};
