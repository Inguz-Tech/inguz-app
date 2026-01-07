import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ConversationItem {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  last_message_at: string;
  last_message_preview: string;
}

export const useConversationsList = (agentId?: string) => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ['conversations-list', agentId, tenantId],
    queryFn: async (): Promise<ConversationItem[]> => {
      if (!tenantId) {
        return [];
      }

      let query = supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          last_message_at,
          tenant_id,
          contacts (
            name,
            phone
          ),
          messages (
            content
          )
        `)
        .eq('tenant_id', tenantId)
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar conversas: ${error.message}`);
      }

      return (data || []).map((conv: any) => {
        const messages = conv.messages || [];
        const lastMessage = messages[messages.length - 1];
        
        return {
          id: conv.id,
          contact_id: conv.contact_id,
          contact_name: conv.contacts?.name || 'Sem nome',
          contact_phone: conv.contacts?.phone || '',
          last_message_at: conv.last_message_at,
          last_message_preview: lastMessage?.content || '',
        };
      });
    },
    enabled: !!tenantId,
  });
};
