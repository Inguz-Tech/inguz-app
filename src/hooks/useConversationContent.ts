import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender_type: 'Agent' | 'CLIENT';
  message_type: string;
}

const PAGE_SIZE = 20;

export const useConversationContent = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: ['conversation-content', conversationId],
    queryFn: async ({ pageParam = 0 }): Promise<{ messages: Message[], hasMore: boolean }> => {
      // Primeiro, contar total de mensagens
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      const totalMessages = count || 0;
      
      // Calcular o offset do final (mensagens mais recentes)
      const offset = pageParam * PAGE_SIZE;
      
      // Buscar mensagens do final para o início
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, timestamp, sender_type, message_type')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching conversation content:', error);
        return { messages: [], hasMore: false };
      }

      // Reverter a ordem para que fiquem do mais antigo para o mais novo
      const messages = (data || []).reverse();
      const hasMore = offset + PAGE_SIZE < totalMessages;

      return { messages, hasMore };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!conversationId,
  });
};
