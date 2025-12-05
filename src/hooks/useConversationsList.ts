import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ConversationItem {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  last_message_at: string;
  last_message_preview: string;
}

export const useConversationsList = (agentId?: string) => {
  return useQuery({
    queryKey: ['conversations-list', agentId],
    queryFn: async (): Promise<ConversationItem[]> => {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          last_message_at,
          contacts (
            name,
            phone
          ),
          messages (
            content,
            created_at
          )
        `)
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return (data || []).map((conv: any) => {
        // Sort messages by created_at descending to get the last message
        const messages = conv.messages || [];
        const sortedMessages = messages.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMessage = sortedMessages[0];
        
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
  });
};
