import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Bot } from 'lucide-react';
import { useConversationsList } from '@/hooks/useConversationsList';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, contactId: string) => void;
}

export const ConversationList = ({ selectedConversationId, onSelectConversation }: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: conversations, isLoading } = useConversationsList();

  const filteredConversations = conversations?.filter(conv => 
    conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact_phone.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Bar - Fixed */}
      <div className="p-4 border-b bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : filteredConversations && filteredConversations.length > 0 ? (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedConversationId === conv.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectConversation(conv.id, conv.contact_id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {conv.contact_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm truncate">{conv.contact_name}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {format(new Date(conv.last_message_at), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{conv.contact_phone}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message_preview}</p>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit mt-2">
                      <Bot className="h-3 w-3" />
                      Agente de IA
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
          </div>
        )}
      </div>
    </div>
  );
};
