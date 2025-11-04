import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const Settings = () => {
  const { profile, tenant, role } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Configurações</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Tenant</CardTitle>
              <CardDescription>Detalhes da sua conta organizacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ID do Tenant</Label>
                <Input value={tenant?.id || ''} disabled />
              </div>
              <div>
                <Label>Nome do Tenant</Label>
                <Input value={tenant?.name || ''} disabled />
              </div>
              <div>
                <Label>Plano</Label>
                <div className="mt-2">
                  <Badge variant={tenant?.plan === 'free' ? 'secondary' : 'default'}>
                    {tenant?.plan === 'free' ? 'Gratuito' : 'Premium'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Usuário</CardTitle>
              <CardDescription>Seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={profile?.full_name || ''} />
              </div>
              <div>
                <Label>ID do Usuário</Label>
                <Input value={profile?.id || ''} disabled />
              </div>
              <div>
                <Label>Função</Label>
                <div className="mt-2">
                  <Badge>{role === 'admin' ? 'Administrador' : 'Visualizador'}</Badge>
                </div>
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
