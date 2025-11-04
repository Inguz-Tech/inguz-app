import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot } from 'lucide-react';

const mockAgents = [
  {
    id: '1',
    name: 'Agente de Vendas',
    status: 'active',
    conversations: 234,
    description: 'Atendimento automatizado para vendas',
  },
  {
    id: '2',
    name: 'Suporte Técnico',
    status: 'active',
    conversations: 145,
    description: 'Suporte técnico automatizado',
  },
];

const Agents = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Agentes</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                        {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{agent.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{agent.conversations}</p>
                    <p className="text-xs text-muted-foreground">Conversas</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Agents;
