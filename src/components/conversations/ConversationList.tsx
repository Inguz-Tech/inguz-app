import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Bot, MessageSquarePlus } from 'lucide-react';
import { useConversationsList } from '@/hooks/useConversationsList';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Format Brazilian phone numbers: 5511985218470 → +55 (11) 98521-8470
const formatBrazilianPhone = (phone: string): string => {
  // Remove @lid suffix and non-numeric characters
  const cleaned = phone.replace(/@.*$/, '').replace(/\D/g, '');
  
  // Check if it's a Brazilian number (starts with 55 and has 12-13 digits)
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const rest = cleaned.slice(4);
    
    // Format based on length (mobile: 9 digits, landline: 8 digits)
    if (rest.length === 9) {
      return `+${countryCode} (${areaCode}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else if (rest.length === 8) {
      return `+${countryCode} (${areaCode}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }
  
  // Return original if not matching expected format
  return phone.replace(/@.*$/, '');
};

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, contactId: string) => void;
  isMobile?: boolean;
}

export const ConversationList = ({ 
  selectedConversationId, 
  onSelectConversation,
  isMobile = false
}: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: conversations, isLoading } = useConversationsList();

  const filteredConversations = conversations?.filter(conv => 
    conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact_phone.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-burgundy font-bold text-lg">INGUZ</span>
            <span className="text-navy font-bold text-lg">.TECH</span>
          </div>
          <Button variant="ghost" size="icon">
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Search Bar */}
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
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted ${
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
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message_preview}</p>
                    {!isMobile && (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">{formatBrazilianPhone(conv.contact_phone)}</p>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit mt-2">
                          <Bot className="h-3 w-3" />
                          Agente de IA
                        </Badge>
                      </>
                    )}
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
