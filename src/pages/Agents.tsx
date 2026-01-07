import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Bot, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { useAgentStats } from '@/hooks/useAgentStats';
import { formatBrazilianPhone } from '@/lib/utils';

const Agents = () => {
  const { tenant } = useAuth();
  const { data: agents, isLoading, isError, refetch } = useAgents(tenant?.id);
  const { data: agentStats } = useAgentStats(tenant?.id);

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

        {isLoading ? (
          <LoadingState message="Carregando agentes..." />
        ) : isError ? (
          <ErrorState 
            title="Erro ao carregar agentes"
            message="Não foi possível carregar a lista de agentes."
            onRetry={() => refetch()}
          />
        ) : agents && agents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-navy text-white text-lg">
                          {agent.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{formatBrazilianPhone(agent.whatsapp_number)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {agent.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{agentStats?.[agent.id] || 0}</p>
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
        ) : (
          <EmptyState
            title="Nenhum agente cadastrado"
            message="Crie seu primeiro agente para começar"
            icon={<Bot className="h-6 w-6 text-muted-foreground" />}
            action={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Agente
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Agents;
