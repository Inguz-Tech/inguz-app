import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useContactDetails } from '@/hooks/useContactDetails';
import { Tag, User, Mail, Phone, Save, ArrowLeft, Edit } from 'lucide-react';

interface ContactDetailsProps {
  contactId: string | null;
  isMobile?: boolean;
  onBack?: () => void;
}

export const ContactDetails = ({ 
  contactId,
  isMobile = false,
  onBack
}: ContactDetailsProps) => {
  const { data: contactDetails } = useContactDetails(contactId || '');
  const [notes, setNotes] = useState('');

  const handleSaveNotes = () => {
    console.log('Salvando notas:', notes);
  };

  if (!contactDetails) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Mobile Header */}
        {isMobile && onBack && (
          <div className="border-b p-4 bg-card flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Informações</h2>
          </div>
        )}
        {!isMobile && (
          <div className="border-b p-4 bg-card">
            <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-center text-muted-foreground text-sm">
            Selecione uma conversa para ver os detalhes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Mobile Header */}
      {isMobile && onBack && (
        <div className="border-b p-4 bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Informações</h2>
          </div>
          <Button variant="ghost" size="icon">
            <Edit className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Profile Header */}
      <div className={`border-b p-4 md:p-6 bg-card ${isMobile ? '' : ''}`}>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-3">
            <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary">
              {contactDetails.name[0]}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{contactDetails.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{contactDetails.phone}</p>
          <Badge className="mt-2" variant="secondary">{contactDetails.status}</Badge>
        </div>
      </div>

      {/* Tabs Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="profile" className="w-full h-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-card">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="p-4 space-y-6 mt-0">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações de Contato
              </h4>
              <div className="space-y-2">
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Phone className="h-3 w-3" />
                    <span>Telefone</span>
                  </div>
                  <p className="text-sm font-medium">{contactDetails.phone}</p>
                </div>
                {contactDetails.variables?.email && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </div>
                    <p className="text-sm font-medium">{contactDetails.variables.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {contactDetails.tags && contactDetails.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {contactDetails.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Variables */}
            {contactDetails.variables && Object.keys(contactDetails.variables).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Variáveis Personalizadas</h4>
                <div className="space-y-2">
                  {Object.entries(contactDetails.variables).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{key}</p>
                      <p className="text-sm">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="p-4 space-y-4 mt-0">
            <div>
              <h4 className="font-semibold text-sm mb-2">Anotações Internas</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Adicione observações sobre este contato ou conversa
              </p>
              <Textarea
                placeholder="Digite suas anotações aqui..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[200px]"
              />
              <Button onClick={handleSaveNotes} className="w-full mt-3">
                <Save className="h-4 w-4 mr-2" />
                Salvar Notas
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
