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

    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        tenant_id,
        user_roles (role)
      `);

    if (role === 'admin') {
      query = query.eq('tenant_id', tenant?.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao carregar usuários');
      return;
    }

    if (data) {
      const formattedUsers = await Promise.all(
        data.map(async (user: any) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
          return {
            id: user.id,
            email: authUser?.user?.email || '',
            full_name: user.full_name,
            role: user.user_roles?.[0]?.role || 'viewer',
            tenant_id: user.tenant_id,
          };
        })
      );
      setUsers(formattedUsers);
    }
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

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
        },
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

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: formData.full_name,
        tenant_id: targetTenantId,
      });

    if (profileError) {
      toast.error(`Erro ao criar perfil: ${profileError.message}`);
      return;
    }

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

    // Update role
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: formData.role })
      .eq('user_id', editingUser.id);

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
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      return;
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
      return;
    }

    toast.success(`Usuário ${userName} excluído com sucesso!`);
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
