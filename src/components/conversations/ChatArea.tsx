import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversationContent } from '@/hooks/useConversationContent';
import { useContactDetails } from '@/hooks/useContactDetails';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Paperclip, Image as ImageIcon, UserX, ArrowRightLeft, ArrowLeft, Info } from 'lucide-react';
import { formatBrazilianPhone } from '@/lib/utils';

interface ChatAreaProps {
  conversationId: string | null;
  contactId: string | null;
  isMobile?: boolean;
  onBack?: () => void;
  onOpenDetails?: () => void;
}

export const ChatArea = ({ 
  conversationId, 
  contactId,
  isMobile = false,
  onBack,
  onOpenDetails
}: ChatAreaProps) => {
  const { data: messages, isLoading } = useConversationContent(conversationId || '');
  const { data: contactDetails } = useContactDetails(contactId || '');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    console.log('Enviando mensagem:', messageText);
    setMessageText('');
  };

  if (!contactDetails) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-3 md:p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile: Back Button */}
            {isMobile && onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {contactDetails.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm md:text-base">{contactDetails.name}</p>
              <p className="text-xs text-muted-foreground">{formatBrazilianPhone(contactDetails.phone)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile: Info Button */}
            {isMobile && onOpenDetails && (
              <Button variant="ghost" size="icon" onClick={onOpenDetails}>
                <Info className="h-5 w-5" />
              </Button>
            )}
            
            {/* Desktop: Action Buttons */}
            {!isMobile && (
              <>
                <Button variant="outline" size="sm">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transferir
                </Button>
                <Button variant="destructive" size="sm">
                  <UserX className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-muted/5">
        <div className="p-3 md:p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Carregando mensagens...</div>
          ) : messages && messages.length > 0 ? (
            <>
              {(() => {
                const elements: JSX.Element[] = [];
                let lastDate: Date | null = null;

                messages.forEach((message) => {
                  const messageDate = parseISO(message.timestamp);
                  
                  if (!lastDate || !isSameDay(lastDate, messageDate)) {
                    elements.push(
                      <div key={`date-${message.id}`} className="flex justify-center my-4">
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
                        className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 ${
                          message.sender_type === 'Agent'
                            ? 'bg-navy text-white rounded-br-sm'
                            : 'bg-card border rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block text-right">
                          {format(messageDate, 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                });

                return elements;
              })()}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">Nenhuma mensagem</div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t p-3 md:p-4 bg-card">
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <ImageIcon className="h-5 w-5" />
              </Button>
            </>
          )}
          <Input
            placeholder="Digite uma mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button 
            size="icon"
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
