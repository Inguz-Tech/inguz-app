import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { tenantSchema, type TenantFormData } from '@/lib/validations';

export const TenantManagement = () => {
  const { role } = useAuth();
  const isMasterAdmin = role === 'master_admin';

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      tenant_name: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
    },
  });

  const onSubmit = async (data: TenantFormData) => {
    try {
      // Step 1: Create Tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.tenant_name.trim(),
          plan: 'free',
        })
        .select()
        .single();

      if (tenantError) {
        toast.error(`Erro ao criar tenant: ${tenantError.message}`);
        return;
      }

      // Step 2: Create Admin User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.admin_email.trim(),
        password: data.admin_password,
        options: {
          data: {
            full_name: data.admin_name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        toast.error(`Erro ao criar usuário admin: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário admin');
        return;
      }

      // Step 3: Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: data.admin_name.trim(),
          tenant_id: tenantData.id,
        });

      if (profileError) {
        toast.error(`Erro ao criar perfil do admin: ${profileError.message}`);
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
        return;
      }

      // Success!
      toast.success(
        `Tenant "${data.tenant_name}" e Admin inicial configurados com sucesso! Um email de ativação foi enviado para ${data.admin_email}.`
      );

      form.reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro inesperado: ${errorMessage}`);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Novo Tenant *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Administrador Inicial</h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="admin_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Administrador Inicial *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admin_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Administrador Inicial *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admin_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Inicial do Admin *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Criando...' : 'Criar Tenant'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
