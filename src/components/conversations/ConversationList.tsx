import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Bot, MessageSquarePlus, MessageSquare, CalendarIcon, X } from 'lucide-react';
import { useConversationsList } from '@/hooks/useConversationsList';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBrazilianPhone, stripWhatsAppFormatting } from '@/lib/utils';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { data: conversations, isLoading, isError, refetch } = useConversationsList();

  const filteredConversations = conversations?.filter(conv => {
    const matchesSearch = conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contact_phone.includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    if (dateRange?.from) {
      const messageDate = new Date(conv.last_message_at);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      
      if (!isWithinInterval(messageDate, { start: from, end: to })) {
        return false;
      }
    }
    
    return true;
  });

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
      <div className="p-4 border-b bg-card space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal flex-1",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          {dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(undefined)}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingState message="Carregando conversas..." size="sm" />
        ) : isError ? (
          <ErrorState 
            title="Erro ao carregar"
            message="Não foi possível carregar as conversas."
            onRetry={() => refetch()}
          />
        ) : filteredConversations && filteredConversations.length > 0 ? (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted ${
                  selectedConversationId === conv.id ? 'bg-muted' : ''
                }`}
                onClick={() => {
                  analytics.selectConversation(conv.id);
                  onSelectConversation(conv.id, conv.contact_id);
                }}
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
                    <p className="text-xs text-muted-foreground truncate">{stripWhatsAppFormatting(conv.last_message_preview || '')}</p>
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
          <EmptyState
            title={searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
            message={searchTerm ? 'Tente buscar por outro termo' : 'As conversas aparecerão aqui'}
            icon={<MessageSquare className="h-6 w-6 text-muted-foreground" />}
          />
        )}
      </div>
    </div>
  );
};
