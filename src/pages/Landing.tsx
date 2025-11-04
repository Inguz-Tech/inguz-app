import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, BarChart3, Users, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen">
      <div 
        className="relative bg-background" 
        style={{ 
          backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      >
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
              Transforme seu negócio com{' '}
              <span className="text-primary">automação inteligente</span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Centralize métricas e conversas do WhatsApp em uma única plataforma poderosa
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="text-lg">
                  Contratar Agora
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <MessageSquare className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-bold text-foreground">Automação WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie todas as conversas do WhatsApp em um só lugar
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <BarChart3 className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-bold text-foreground">Métricas em Tempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe o desempenho com dashboards detalhados
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Users className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-bold text-foreground">Gestão de Contatos</h3>
              <p className="text-sm text-muted-foreground">
                Organize e segmente seus contatos de forma inteligente
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Zap className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-bold text-foreground">Respostas Instantâneas</h3>
              <p className="text-sm text-muted-foreground">
                Configure agentes inteligentes para responder automaticamente
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
