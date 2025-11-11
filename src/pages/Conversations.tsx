import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, User } from 'lucide-react';
import { useConversationsList } from '@/hooks/useConversationsList';
import { useConversationContent, Message } from '@/hooks/useConversationContent';
import { useContactDetails } from '@/hooks/useContactDetails';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Conversations = () => {
  const { data: conversations, isLoading: conversationsLoading } = useConversationsList();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const { 
    data: messagesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useConversationContent(selectedConversationId || '');
  
  const { data: contactDetails } = useContactDetails(selectedContactId || '');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Flatten todas as mensagens das páginas
  const allMessages: Message[] = messagesData?.pages.flatMap(page => page.messages) || [];

  const handleSelectConversation = (conversationId: string, contactId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedContactId(contactId);
  };

  // Auto-scroll para o final quando selecionar uma conversa ou receber novas mensagens
  useEffect(() => {
    if (scrollRef.current && isAtBottom && allMessages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length, isAtBottom]);

  // Reset para bottom quando mudar de conversa
  useEffect(() => {
    setIsAtBottom(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversationId]);

  // Detectar scroll para carregar mais mensagens
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Detectar se está no topo para carregar mais mensagens antigas
    if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const previousScrollHeight = scrollHeight;
      fetchNextPage().then(() => {
        // Manter a posição do scroll após carregar novas mensagens
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - previousScrollHeight;
        }
      });
    }

    // Detectar se está no fundo
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Renderizar marcador de data
  const renderDateMarker = (date: string) => (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
        {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>
    </div>
  );

  // Agrupar mensagens por data e renderizar
  const renderMessages = () => {
    if (!allMessages || allMessages.length === 0) {
      return <div className="text-center text-muted-foreground">Nenhuma mensagem</div>;
    }

    const elements: JSX.Element[] = [];
    let lastDate: Date | null = null;

    allMessages.forEach((message, index) => {
      const messageDate = parseISO(message.timestamp);
      
      // Adicionar marcador de data se mudou o dia
      if (!lastDate || !isSameDay(lastDate, messageDate)) {
        elements.push(
          <div key={`date-${message.id}`}>
            {renderDateMarker(message.timestamp)}
          </div>
        );
        lastDate = messageDate;
      }

      // Adicionar mensagem
      elements.push(
        <div
          key={message.id}
          className={`flex ${message.sender_type === 'Agent' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.sender_type === 'Agent'
                ? 'bg-navy text-white'
                : 'bg-muted text-foreground'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            <span className="mt-1 block text-xs opacity-70">
              {format(messageDate, 'HH:mm')}
            </span>
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-background overflow-hidden">
      <div className="grid h-full grid-cols-12">
        {/* Lista de Conversas */}
        <div className="col-span-3 border-r flex flex-col h-full">
          <div className="border-b p-4 flex-shrink-0">
            <h2 className="text-lg font-semibold">Conversas</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 text-center">Carregando...</div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`m-2 cursor-pointer p-4 hover:bg-navy/10 ${
                    selectedConversationId === conv.id ? 'bg-navy text-white' : ''
                  }`}
                  onClick={() => handleSelectConversation(conv.id, conv.contact_id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{conv.contact_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{conv.contact_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.last_message_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{conv.contact_phone}</p>
                      <p className="truncate text-sm text-muted-foreground">{conv.last_message_preview}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada</div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="col-span-6 flex flex-col h-full">
          {contactDetails ? (
            <>
              {/* Cabeçalho Fixo */}
              <div className="border-b p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{contactDetails.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{contactDetails.name}</p>
                    <p className="text-sm text-muted-foreground">{contactDetails.phone}</p>
                  </div>
                </div>
              </div>

              {/* Área de Mensagens com Scroll Independente e Invertido */}
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-4 space-y-4">
                  {/* Indicador de carregamento de mensagens antigas */}
                  {isFetchingNextPage && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      Carregando mensagens antigas...
                    </div>
                  )}
                  
                  {/* Marcador de início do chat */}
                  {!hasNextPage && allMessages.length > 0 && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground font-medium">
                        Início da conversa
                      </div>
                    </div>
                  )}

                  {/* Mensagens com marcadores de data */}
                  {renderMessages()}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Selecione uma conversa
            </div>
          )}
        </div>

        {/* Detalhes do Contato */}
        <div className="col-span-3 border-l flex flex-col h-full">
          <div className="border-b p-4 flex-shrink-0">
            <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contactDetails ? (
              <div className="p-4 space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">{contactDetails.name[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="mt-2 font-semibold">{contactDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{contactDetails.phone}</p>
                  <Badge className="mt-2">{contactDetails.status}</Badge>
                </div>

                {contactDetails.tags && contactDetails.tags.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <h4 className="font-semibold">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contactDetails.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {contactDetails.variables && Object.keys(contactDetails.variables).length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <h4 className="font-semibold">Variáveis</h4>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(contactDetails.variables).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted p-2">
                          <p className="text-xs font-medium text-muted-foreground">{key}</p>
                          <p className="text-sm">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Selecione uma conversa para ver os detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
