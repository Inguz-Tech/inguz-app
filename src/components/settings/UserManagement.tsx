import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'viewer' as 'admin' | 'viewer',
  });

  const canManageUsers = role === 'master_admin' || role === 'admin';

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, tenant?.id]);

  const fetchUsers = async () => {
    if (!tenant?.id && role !== 'master_admin') return;

    // First, get profiles
    let profileQuery = supabase
      .from('profiles')
      .select('id, full_name, tenant_id');

    if (role === 'admin') {
      profileQuery = profileQuery.eq('tenant_id', tenant?.id);
    }

    const { data: profiles, error: profileError } = await profileQuery;

    if (profileError) {
      toast.error('Erro ao carregar usuários');
      console.error('Error fetching profiles:', profileError);
      return;
    }

    console.log('Profiles fetched:', profiles);

    if (!profiles || profiles.length === 0) {
      setUsers([]);
      return;
    }

    // Get user IDs
    const userIds = profiles.map(p => p.id);

    // Fetch roles for these users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    console.log('Roles fetched:', roles);

    // Create a map of user_id to role
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    // Try to fetch emails from auth.users using RPC
    const { data: emailsData } = await supabase.rpc('get_user_emails', {
      user_ids: userIds
    });

    console.log('Emails fetched:', emailsData);

    const emailMap = new Map(emailsData?.map((e: any) => [e.id, e.email]) || []);

    // Format users data
    const formattedUsers = profiles.map((profile: any) => {
      return {
        id: profile.id,
        email: (emailMap.get(profile.id) as string) || 'Email não disponível',
        full_name: profile.full_name,
        role: roleMap.get(profile.id) || 'viewer',
        tenant_id: profile.tenant_id,
      };
    });
    
    console.log('Formatted users:', formattedUsers);
    setUsers(formattedUsers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    const targetTenantId = role === 'master_admin' && tenant?.id ? tenant.id : profile?.tenant_id;

    if (!targetTenantId) {
      toast.error('Tenant ID não encontrado');
      return;
    }

    // Create auth user - the profile will be created automatically by trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
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

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: formData.role,
      });

    if (roleError) {
      toast.error(`Erro ao atribuir papel: ${roleError.message}`);
      return;
    }

    toast.success(`Usuário ${formData.full_name} criado com sucesso!`);
    setIsDialogOpen(false);
    resetForm();
    fetchUsers();
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: formData.full_name })
      .eq('id', editingUser.id);

    if (profileError) {
      toast.error(`Erro ao atualizar perfil: ${profileError.message}`);
      return;
    }

    // Delete existing role and insert new one
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', editingUser.id);

    if (deleteError) {
      toast.error(`Erro ao remover papel anterior: ${deleteError.message}`);
      return;
    }

    // Insert new role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: editingUser.id,
        role: formData.role,
      });

    if (roleError) {
      toast.error(`Erro ao atualizar papel: ${roleError.message}`);
      return;
    }

    toast.success(`Usuário ${formData.full_name} atualizado com sucesso!`);
    setIsDialogOpen(false);
    setEditingUser(null);
    resetForm();
    fetchUsers();
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja desativar o usuário ${userName}? O usuário não poderá mais fazer login.`)) {
      return;
    }

    // Soft delete: remove role to prevent login
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao desativar usuário: ${error.message}`);
      return;
    }

    toast.success(`Usuário ${userName} desativado com sucesso!`);
    fetchUsers();
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role === 'master_admin' ? 'admin' : user.role,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'viewer',
    });
    setEditingUser(null);
  };

  const getRoleBadge = (userRole: string) => {
    const roleMap = {
      master_admin: { label: 'Master Admin', variant: 'default' as const },
      admin: { label: 'Admin do Tenant', variant: 'default' as const },
      viewer: { label: 'Visualizador', variant: 'secondary' as const },
    };
    const roleInfo = roleMap[userRole as keyof typeof roleMap];
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole);

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
                <Button onClick={resetForm}>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingUser}
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div>
                      <Label htmlFor="password">Senha Inicial *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="role">Papel (Role) *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'viewer' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin do Tenant</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Filtrar por Papel</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
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
