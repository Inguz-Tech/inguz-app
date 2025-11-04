import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Tag, User } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  variables: Record<string, string>;
  tags: string[];
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '+55 11 98765-4321',
    lastMessage: 'Obrigado pelo atendimento!',
    lastMessageTime: '10:30',
    variables: { cidade: 'São Paulo', interesse: 'Produto A' },
    tags: ['Cliente', 'Hot'],
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '+55 11 91234-5678',
    lastMessage: 'Gostaria de saber mais informações',
    lastMessageTime: '09:15',
    variables: { cidade: 'Rio de Janeiro', interesse: 'Produto B' },
    tags: ['Lead'],
  },
];

const mockMessages = [
  { id: '1', text: 'Olá! Como posso ajudar?', sender: 'agent', time: '10:00' },
  { id: '2', text: 'Oi, gostaria de saber sobre os produtos', sender: 'contact', time: '10:02' },
  { id: '3', text: 'Claro! Temos diversos produtos disponíveis...', sender: 'agent', time: '10:05' },
  { id: '4', text: 'Obrigado pelo atendimento!', sender: 'contact', time: '10:30' },
];

const Conversations = () => {
  const [selectedContact, setSelectedContact] = useState<Contact>(mockContacts[0]);

  return (
    <div className="h-[calc(100vh-4rem)] bg-background">
      <div className="grid h-full grid-cols-12">
        {/* Lista de Conversas */}
        <div className="col-span-3 border-r">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Conversas</h2>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)]">
            {mockContacts.map((contact) => (
              <Card
                key={contact.id}
                className={`m-2 cursor-pointer p-4 hover:bg-accent ${
                  selectedContact.id === contact.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{contact.name}</p>
                      <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    <p className="truncate text-sm text-muted-foreground">{contact.lastMessage}</p>
                  </div>
                </div>
              </Card>
            ))}
          </ScrollArea>
        </div>

        {/* Área de Chat */}
        <div className="col-span-6 flex flex-col">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedContact.name}</p>
                <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'agent'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p>{message.text}</p>
                    <span className="mt-1 block text-xs opacity-70">{message.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detalhes do Contato */}
        <div className="col-span-3 border-l">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
          </div>
          <ScrollArea className="h-[calc(100%-5rem)]">
            <div className="p-4 space-y-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">{selectedContact.name[0]}</AvatarFallback>
                </Avatar>
                <h3 className="mt-2 font-semibold">{selectedContact.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                <Badge className="mt-2">Online</Badge>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <h4 className="font-semibold">Tags</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <h4 className="font-semibold">Variáveis</h4>
                </div>
                <div className="space-y-2">
                  {Object.entries(selectedContact.variables).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-muted p-2">
                      <p className="text-xs font-medium text-muted-foreground">{key}</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
