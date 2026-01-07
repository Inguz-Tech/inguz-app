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

export interface DateRangeFilter {
  from: Date;
  to?: Date;
}

export const useConversationsList = (agentId?: string, dateRange?: DateRangeFilter) => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ['conversations-list', agentId, tenantId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<ConversationItem[]> => {
      if (!tenantId) {
        return [];
      }

      // Se há filtro de data, precisamos buscar conversas que tenham mensagens no período
      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);

        // Buscar IDs de conversas que têm mensagens no período
        const { data: messagesInRange, error: messagesError } = await supabase
          .from('messages')
          .select('conversation_id')
          .gte('created_at', fromDate.toISOString())
          .lte('created_at', toDate.toISOString());

        if (messagesError) {
          throw new Error(`Erro ao buscar mensagens: ${messagesError.message}`);
        }

        // Extrair IDs únicos de conversas
        const conversationIds = [...new Set(messagesInRange?.map(m => m.conversation_id) || [])];

        if (conversationIds.length === 0) {
          return [];
        }

        // Buscar as conversas filtradas
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
          .in('id', conversationIds)
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
      }

      // Sem filtro de data - busca padrão
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
