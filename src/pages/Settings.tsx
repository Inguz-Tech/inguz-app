import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/settings/UserManagement';
import { TenantManagement } from '@/components/settings/TenantManagement';

const Settings = () => {
  const { profile, tenant, role } = useAuth();

  const canManageUsers = role === 'master_admin' || role === 'admin';
  const isMasterAdmin = role === 'master_admin';

  const getRoleLabel = (userRole: string | null) => {
    const roleMap = {
      master_admin: 'Master Admin',
      admin: 'Admin do Tenant',
      viewer: 'Visualizador',
    };
    return roleMap[userRole as keyof typeof roleMap] || 'Desconhecido';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Configurações</h1>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account">Minha Conta</TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="users">Gestão de Usuários e Acessos</TabsTrigger>
            )}
            {isMasterAdmin && (
              <TabsTrigger value="tenants">Cadastro de Tenants</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-6">
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
                    <Badge>{getRoleLabel(role)}</Badge>
                  </div>
                </div>
                <Button>Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}

          {isMasterAdmin && (
            <TabsContent value="tenants">
              <TenantManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
