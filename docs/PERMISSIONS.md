# Matriz de Permissões

## Roles do Sistema

| Role | Descrição |
|------|-----------|
| `master_admin` | Administrador global, pode gerenciar todos os tenants |
| `admin` | Administrador do tenant, gestão de usuários e agentes |
| `viewer` | Visualizador, acesso somente leitura |

## Matriz de Permissões por Funcionalidade

### Dashboard

| Ação | master_admin | admin | viewer |
|------|:------------:|:-----:|:------:|
| Visualizar métricas | ✅ | ✅ | ✅ |
| Filtrar por período | ✅ | ✅ | ✅ |
| Exportar dados | ✅ | ✅ | ❌ |

### Conversas

| Ação | master_admin | admin | viewer |
|------|:------------:|:-----:|:------:|
| Listar conversas | ✅ | ✅ | ✅ |
| Ver mensagens | ✅ | ✅ | ✅ |
| Ver detalhes do contato | ✅ | ✅ | ✅ |
| Enviar mensagens | ✅ | ✅ | ❌ |
| Transferir conversa | ✅ | ✅ | ❌ |
| Finalizar conversa | ✅ | ✅ | ❌ |

### Agentes

| Ação | master_admin | admin | viewer |
|------|:------------:|:-----:|:------:|
| Listar agentes | ✅ | ✅ | ✅ |
| Criar agente | ✅ | ✅ | ❌ |
| Editar agente | ✅ | ✅ | ❌ |
| Ativar/Desativar | ✅ | ✅ | ❌ |
| Excluir agente | ✅ | ✅ | ❌ |

### Configurações - Usuários

| Ação | master_admin | admin | viewer |
|------|:------------:|:-----:|:------:|
| Listar usuários do tenant | ✅ | ✅ | ❌ |
| Criar usuário | ✅ | ✅ | ❌ |
| Editar usuário | ✅ | ✅ | ❌ |
| Alterar role | ✅ | ✅* | ❌ |
| Excluir usuário | ✅ | ✅ | ❌ |

*Admin só pode definir roles `admin` ou `viewer`, não `master_admin`.

### Configurações - Tenants

| Ação | master_admin | admin | viewer |
|------|:------------:|:-----:|:------:|
| Listar todos os tenants | ✅ | ❌ | ❌ |
| Criar tenant | ✅ | ❌ | ❌ |
| Editar tenant | ✅ | ❌ | ❌ |
| Excluir tenant | ✅ | ❌ | ❌ |

## Implementação de RLS (Row Level Security)

### Tabela: tenants

```sql
-- SELECT: master_admin vê todos, outros veem apenas o próprio
CREATE POLICY "tenants_select" ON tenants
FOR SELECT USING (
  has_role(auth.uid(), 'master_admin') 
  OR id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- INSERT/UPDATE/DELETE: apenas master_admin
CREATE POLICY "tenants_modify" ON tenants
FOR ALL USING (has_role(auth.uid(), 'master_admin'));
```

### Tabela: profiles

```sql
-- SELECT: usuários do mesmo tenant
CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
```

### Tabela: user_roles

```sql
-- SELECT: própria role ou admin/master_admin do tenant
CREATE POLICY "user_roles_select" ON user_roles
FOR SELECT USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'master_admin')
  OR (
    has_role(auth.uid(), 'admin') 
    AND EXISTS (
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = user_id 
      AND p1.tenant_id = p2.tenant_id
    )
  )
);
```

### Tabela: agents

```sql
-- SELECT/INSERT/UPDATE/DELETE: filtrado por tenant_id
CREATE POLICY "agents_tenant_isolation" ON agents
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
```

### Tabela: conversations

```sql
-- SELECT: filtrado por tenant_id
CREATE POLICY "conversations_select" ON conversations
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
```

### Tabela: messages

```sql
-- SELECT: mensagens de conversas do tenant
CREATE POLICY "messages_select" ON messages
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
```

### Tabela: contacts

```sql
-- SELECT: contatos do tenant
CREATE POLICY "contacts_select" ON contacts
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
```

## Função Auxiliar: has_role

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

## Verificação de Permissões no Frontend

```typescript
// AuthContext expõe a role do usuário
const { role } = useAuth();

// Verificação condicional
const canManageUsers = role === 'master_admin' || role === 'admin';
const canManageTenants = role === 'master_admin';
const isReadOnly = role === 'viewer';
```

## Notas de Segurança

⚠️ **Importante**: 

1. As verificações de role no frontend são apenas para UX (esconder botões).
2. A segurança real é garantida pelas políticas RLS no Supabase.
3. Nunca confie apenas em verificações client-side.
4. Todas as operações sensíveis devem ter RLS policies correspondentes.

## Auditoria

Recomenda-se implementar:

- [ ] Tabela `audit_logs` para registrar ações críticas
- [ ] Triggers para INSERT/UPDATE/DELETE em tabelas sensíveis
- [ ] Logs de acesso e tentativas de violação de permissão
