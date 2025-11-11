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
    <div className="fixed inset-0 top-16 flex bg-background">
      {/* Coluna Esquerda: Lista de Conversas */}
      <div className="w-80 border-r flex-shrink-0">
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Coluna Central: Chat */}
      <div className="flex-1 min-w-0">
        <ChatArea
          conversationId={selectedConversationId}
          contactId={selectedContactId}
        />
      </div>

      {/* Coluna Direita: Detalhes */}
      <div className="w-80 border-l flex-shrink-0">
        <ContactDetails contactId={selectedContactId} />
      </div>
    </div>
  );
};

export default Conversations;
