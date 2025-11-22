import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const TenantManagement = () => {
  const { role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tenant_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  const isMasterAdmin = role === 'master_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Step 1: Create Tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: formData.tenant_name,
          plan: 'free',
        })
        .select()
        .single();

      if (tenantError) {
        toast.error(`Erro ao criar tenant: ${tenantError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create Admin User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.admin_email,
        password: formData.admin_password,
        options: {
          data: {
            full_name: formData.admin_name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        toast.error(`Erro ao criar usuário admin: ${authError.message}`);
        setIsSubmitting(false);
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário admin');
        setIsSubmitting(false);
        return;
      }

      // Step 3: Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.admin_name,
          tenant_id: tenantData.id,
        });

      if (profileError) {
        toast.error(`Erro ao criar perfil do admin: ${profileError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Step 4: Assign Admin Role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
        });

      if (roleError) {
        toast.error(`Erro ao atribuir papel de admin: ${roleError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Success!
      toast.success(
        `Tenant "${formData.tenant_name}" e Admin inicial configurados com sucesso! Um email de ativação foi enviado para ${formData.admin_email}.`
      );

      // Reset form
      setFormData({
        tenant_name: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      });
    } catch (error: any) {
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMasterAdmin) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Apenas Master Admins podem criar novos tenants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Novo Tenant</CardTitle>
        <CardDescription>
          Crie um novo tenant e configure seu administrador inicial. Um email de boas-vindas será
          enviado automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenant_name">Nome do Novo Tenant *</Label>
            <Input
              id="tenant_name"
              placeholder="Ex: Empresa XYZ"
              value={formData.tenant_name}
              onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-4">Administrador Inicial</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin_name">Nome do Administrador Inicial *</Label>
                <Input
                  id="admin_name"
                  placeholder="Nome completo"
                  value={formData.admin_name}
                  onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="admin_email">Email do Administrador Inicial *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="admin_password">Senha Inicial do Admin *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Tenant'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
