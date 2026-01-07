import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender_type: 'Agent' | 'CLIENT';
  message_type: string;
}

export const useConversationContent = (conversationId: string) => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ['conversation-content', conversationId, tenantId],
    queryFn: async (): Promise<Message[]> => {
      if (!tenantId) {
        return [];
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, timestamp, sender_type, message_type, tenant_id')
        .eq('conversation_id', conversationId)
        .eq('tenant_id', tenantId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!conversationId && !!tenantId,
  });
};
