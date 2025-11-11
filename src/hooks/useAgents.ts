import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  tenant_id: string;
  whatsapp_number: string;
}

export const useAgents = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['agents', tenantId],
    queryFn: async (): Promise<Agent[]> => {
      if (!tenantId) {
        return [];
      }

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error fetching agents:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!tenantId,
  });
};
