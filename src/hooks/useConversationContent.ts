import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender_type: 'Agent' | 'CLIENT';
  message_type: string;
}

export const useConversationContent = (conversationId: string) => {
  return useQuery({
    queryKey: ['conversation-content', conversationId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, timestamp, sender_type, message_type')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching conversation content:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!conversationId,
  });
};
