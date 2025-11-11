import { useState } from 'react';
import { ConversationList } from '@/components/conversations/ConversationList';
import { ChatArea } from '@/components/conversations/ChatArea';
import { ContactDetails } from '@/components/conversations/ContactDetails';

const Conversations = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const handleSelectConversation = (conversationId: string, contactId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedContactId(contactId);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-background overflow-hidden">
      <div className="grid h-full grid-cols-12">
        {/* Coluna Esquerda: Lista de Conversas - 20% */}
        <div className="col-span-2 lg:col-span-3">
          <ConversationList
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Coluna Central: Área de Chat - 55-60% */}
        <div className="col-span-6 lg:col-span-5">
          <ChatArea
            conversationId={selectedConversationId}
            contactId={selectedContactId}
          />
        </div>

        {/* Coluna Direita: Detalhes do Contato - 20-25% */}
        <div className="col-span-4 lg:col-span-4">
          <ContactDetails contactId={selectedContactId} />
        </div>
      </div>
    </div>
  );
};

export default Conversations;
