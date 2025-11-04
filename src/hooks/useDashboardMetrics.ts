import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface DashboardMetrics {
  totalConversations: number;
  messagesSent: number;
  messagesReceived: number;
}

export const useDashboardMetrics = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['dashboard-metrics', startDate, endDate],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: sentMessages } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('sender_type', 'agent')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('sender_type', 'contact')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      return {
        totalConversations: conversations?.length || 0,
        messagesSent: sentMessages?.length || 0,
        messagesReceived: receivedMessages?.length || 0,
      };
    },
  });
};
