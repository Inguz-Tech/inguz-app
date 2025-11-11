import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Bot, Clock } from 'lucide-react';
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
    <div className="flex flex-col h-full border-r bg-background">
      {/* Search Bar */}
      <div className="p-4 border-b flex-shrink-0">
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

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <Card
              key={conv.id}
              className={`m-2 cursor-pointer p-3 transition-colors border-l-4 ${
                selectedConversationId === conv.id 
                  ? 'bg-accent border-l-primary' 
                  : 'border-l-transparent hover:bg-muted/50'
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
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      Agente de IA
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
          </div>
        )}
      </div>
    </div>
  );
};
