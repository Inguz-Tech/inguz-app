import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConversationContent } from '@/hooks/useConversationContent';
import { useContactDetails } from '@/hooks/useContactDetails';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Paperclip, Image as ImageIcon, UserX, ArrowRightLeft } from 'lucide-react';

interface ChatAreaProps {
  conversationId: string | null;
  contactId: string | null;
}

export const ChatArea = ({ conversationId, contactId }: ChatAreaProps) => {
  const { data: messages, isLoading } = useConversationContent(conversationId || '');
  const { data: contactDetails } = useContactDetails(contactId || '');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const previousConversationId = useRef<string | null>(null);

  // Scroll automático ao abrir uma conversa ou quando mensagens carregam
  useEffect(() => {
    // Detectar se é uma nova conversa sendo aberta
    const isNewConversation = conversationId !== previousConversationId.current;
    
    if (messagesEndRef.current && messages && messages.length > 0) {
      // Se é uma nova conversa, scroll instantâneo para o final
      if (isNewConversation) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        setIsUserScrolling(false);
        previousConversationId.current = conversationId;
      } 
      // Se não é nova conversa e o usuário não está rolando manualmente, scroll suave
      else if (!isUserScrolling) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, conversationId, isUserScrolling]);

  // Detectar quando o usuário rola manualmente
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Se o usuário está no final, desabilitar flag de scroll manual
      if (isAtBottom) {
        setIsUserScrolling(false);
      } else {
        setIsUserScrolling(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const renderMessages = () => {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return <div className="text-center text-muted-foreground">Nenhuma mensagem</div>;
    }

    const elements: JSX.Element[] = [];
    let lastDate: Date | null = null;

    messages.forEach((message) => {
      const messageDate = parseISO(message.timestamp);
      
      if (!lastDate || !isSameDay(lastDate, messageDate)) {
        elements.push(
          <div key={`date-${message.id}`} className="flex items-center justify-center my-4">
            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
              {format(messageDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>
        );
        lastDate = messageDate;
      }

      elements.push(
        <div
          key={message.id}
          className={`flex ${message.sender_type === 'Agent' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.sender_type === 'Agent'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            <span className="mt-1 block text-xs opacity-70">
              {format(messageDate, 'HH:mm')}
            </span>
          </div>
        </div>
      );
    });

    return elements;
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    // TODO: Implementar envio de mensagem
    console.log('Enviando mensagem:', messageText);
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!contactDetails) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
        <div className="text-center">
          <p className="text-lg">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex-shrink-0 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {contactDetails.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{contactDetails.name}</p>
              <p className="text-xs text-muted-foreground">{contactDetails.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transferir
            </Button>
            <Button variant="destructive" size="sm">
              <UserX className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Carregando mensagens...
            </div>
          ) : (
            <>
              {renderMessages()}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4 flex-shrink-0 bg-card">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Textarea
            placeholder="Digite uma mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[60px] max-h-[120px] resize-none"
          />
          <Button 
            size="icon" 
            className="flex-shrink-0 h-[60px] w-[60px]"
            onClick={handleSend}
            disabled={!messageText.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
