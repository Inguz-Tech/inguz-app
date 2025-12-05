import { useState } from 'react';
import { ConversationList } from '@/components/conversations/ConversationList';
import { ChatArea } from '@/components/conversations/ChatArea';
import { ContactDetails } from '@/components/conversations/ContactDetails';
import { useIsMobile } from '@/hooks/use-mobile';

export type MobileView = 'list' | 'chat' | 'details';

const Conversations = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const isMobile = useIsMobile();

  const handleSelectConversation = (conversationId: string, contactId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedContactId(contactId);
    if (isMobile) {
      setMobileView('chat');
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleOpenDetails = () => {
    setMobileView('details');
  };

  const handleBackToChat = () => {
    setMobileView('chat');
  };

  // Mobile Layout - Single view at a time
  if (isMobile) {
    return (
      <div className="fixed inset-0 top-16 bg-background">
        {mobileView === 'list' && (
          <ConversationList
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            isMobile={true}
          />
        )}
        {mobileView === 'chat' && (
          <ChatArea
            conversationId={selectedConversationId}
            contactId={selectedContactId}
            isMobile={true}
            onBack={handleBackToList}
            onOpenDetails={handleOpenDetails}
          />
        )}
        {mobileView === 'details' && (
          <ContactDetails
            contactId={selectedContactId}
            isMobile={true}
            onBack={handleBackToChat}
          />
        )}
      </div>
    );
  }

  // Desktop Layout - Three columns
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
