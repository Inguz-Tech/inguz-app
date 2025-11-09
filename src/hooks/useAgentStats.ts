import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AgentStats {
  agent_id: string;
  conversation_count: number;
}

export const useAgentStats = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-stats', tenantId],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!tenantId) {
        return {};
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('agent_id')
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error fetching agent stats:', error);
        return {};
      }

      // Contar conversas por agente
      const stats: Record<string, number> = {};
      data?.forEach((conv) => {
        if (conv.agent_id) {
          stats[conv.agent_id] = (stats[conv.agent_id] || 0) + 1;
        }
      });

      return stats;
    },
    enabled: !!tenantId,
  });
};
