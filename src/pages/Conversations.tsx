import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, User } from 'lucide-react';
import { useConversationsList } from '@/hooks/useConversationsList';
import { useConversationContent } from '@/hooks/useConversationContent';
import { useContactDetails } from '@/hooks/useContactDetails';
import { format } from 'date-fns';

const Conversations = () => {
  const { data: conversations, isLoading: conversationsLoading } = useConversationsList();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const { data: messages } = useConversationContent(selectedConversationId || '');
  const { data: contactDetails } = useContactDetails(selectedContactId || '');

  const handleSelectConversation = (conversationId: string, contactId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedContactId(contactId);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-background">
      <div className="grid h-full grid-cols-12">
        {/* Lista de Conversas */}
        <div className="col-span-3 border-r">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Conversas</h2>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)]">
            {conversationsLoading ? (
              <div className="p-4 text-center">Carregando...</div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`m-2 cursor-pointer p-4 hover:bg-accent ${
                    selectedConversationId === conv.id ? 'bg-accent' : ''
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
          </ScrollArea>
        </div>

        {/* Área de Chat */}
        <div className="col-span-6 flex flex-col">
          {contactDetails ? (
            <>
              <div className="border-b p-4">
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

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages && messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_type === 'agent'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p>{message.content}</p>
                          <span className="mt-1 block text-xs opacity-70">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">Nenhuma mensagem</div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Selecione uma conversa
            </div>
          )}
        </div>

        {/* Detalhes do Contato */}
        <div className="col-span-3 border-l">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)]">
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
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
