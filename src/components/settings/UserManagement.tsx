import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/lib/validations';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'master_admin' | 'admin' | 'viewer';
  tenant_id: string;
}

export const UserManagement = () => {
  const { profile, tenant, role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  const canManageUsers = role === 'master_admin' || role === 'admin';

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'viewer',
    },
  });

  const updateForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: '',
      role: 'viewer',
    },
  });

  const activeForm = editingUser ? updateForm : createForm;

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, tenant?.id]);

  const fetchUsers = async () => {
    if (!tenant?.id && role !== 'master_admin') return;

    let profileQuery = supabase
      .from('profiles')
      .select('id, full_name, tenant_id');

    if (role === 'admin') {
      profileQuery = profileQuery.eq('tenant_id', tenant?.id);
    }

    const { data: profiles, error: profileError } = await profileQuery;

    if (profileError) {
      toast.error('Erro ao carregar usuários');
      return;
    }

    if (!profiles || profiles.length === 0) {
      setUsers([]);
      return;
    }

    const userIds = profiles.map((p) => p.id);

    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

    const { data: emailsData } = await supabase.rpc('get_user_emails', {
      user_ids: userIds,
    });

    const emailMap = new Map(
      emailsData?.map((e: { id: string; email: string }) => [e.id, e.email]) || []
    );

    const formattedUsers = profiles.map((userProfile) => ({
      id: userProfile.id,
      email: (emailMap.get(userProfile.id) as string) || 'Email não disponível',
      full_name: userProfile.full_name,
      role: roleMap.get(userProfile.id) || 'viewer',
      tenant_id: userProfile.tenant_id,
    }));

    setUsers(formattedUsers);
  };

  const handleCreate = async (data: CreateUserFormData) => {
    const targetTenantId = role === 'master_admin' && tenant?.id ? tenant.id : profile?.tenant_id;

    if (!targetTenantId) {
      toast.error('Tenant ID não encontrado');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          full_name: data.full_name.trim(),
          tenant_id: targetTenantId,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) {
      toast.error(`Erro ao criar usuário: ${authError.message}`);
      return;
    }

    if (!authData.user) {
      toast.error('Erro ao criar usuário');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: data.role,
    });

    if (roleError) {
      toast.error(`Erro ao atribuir papel: ${roleError.message}`);
      return;
    }

    toast.success(`Usuário ${data.full_name} criado com sucesso!`);
    setIsDialogOpen(false);
    createForm.reset();
    fetchUsers();
  };

  const handleUpdate = async (data: UpdateUserFormData) => {
    if (!editingUser) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name.trim() })
      .eq('id', editingUser.id);

    if (profileError) {
      toast.error(`Erro ao atualizar perfil: ${profileError.message}`);
      return;
    }

    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', editingUser.id);

    if (deleteError) {
      toast.error(`Erro ao remover papel anterior: ${deleteError.message}`);
      return;
    }

    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: editingUser.id,
      role: data.role,
    });

    if (roleError) {
      toast.error(`Erro ao atualizar papel: ${roleError.message}`);
      return;
    }

    toast.success(`Usuário ${data.full_name} atualizado com sucesso!`);
    setIsDialogOpen(false);
    setEditingUser(null);
    updateForm.reset();
    fetchUsers();
  };

  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    if (editingUser) {
      handleUpdate(data as UpdateUserFormData);
    } else {
      handleCreate(data as CreateUserFormData);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja desativar o usuário ${userName}? O usuário não poderá mais fazer login.`
      )
    ) {
      return;
    }

    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao desativar usuário: ${error.message}`);
      return;
    }

    toast.success(`Usuário ${userName} desativado com sucesso!`);
    fetchUsers();
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    updateForm.reset({
      full_name: user.full_name,
      role: user.role === 'master_admin' ? 'admin' : user.role,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    createForm.reset();
    setIsDialogOpen(true);
  };

  const getRoleBadge = (userRole: string) => {
    const roleMap = {
      master_admin: { label: 'Master Admin', variant: 'default' as const },
      admin: { label: 'Admin do Tenant', variant: 'default' as const },
      viewer: { label: 'Visualizador', variant: 'secondary' as const },
    };
    const roleInfo = roleMap[userRole as keyof typeof roleMap];
    return <Badge variant={roleInfo?.variant || 'secondary'}>{roleInfo?.label || userRole}</Badge>;
  };

  const filteredUsers =
    filterRole === 'all' ? users : users.filter((u) => u.role === filterRole);

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Usuários e Acessos</CardTitle>
              <CardDescription>
                Gerencie usuários e suas permissões dentro do tenant
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do usuário. Os campos marcados são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <Form {...activeForm}>
                  <form onSubmit={activeForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={activeForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!editingUser && (
                      <>
                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha Inicial *</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={activeForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Papel (Role) *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin do Tenant</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={activeForm.formState.isSubmitting}>
                        {editingUser ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium">Filtrar por Papel</label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="master_admin">Master Admin</SelectItem>
                <SelectItem value="admin">Admin do Tenant</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id, user.full_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
