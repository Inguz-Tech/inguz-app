# Plano de Trabalho - Backend Supabase

## 📋 Resumo Executivo

Este documento consolida todas as tarefas pendentes para o time de engenharia no Supabase, resultantes da auditoria de segurança e melhorias de arquitetura.

**Prioridade**: 🔴 Crítica | 🟠 Alta | 🟡 Média | 🟢 Baixa

---

## ✅ Checklist Geral

### Fase 1: Auditoria de Segurança (🔴 Crítica)

- [ ] **1.1** Verificar RLS habilitado em TODAS as tabelas
- [ ] **1.2** Criar função `has_role()` se não existir
- [ ] **1.3** Criar função `get_user_tenant_id()` se não existir
- [ ] **1.4** Revisar e corrigir policies de cada tabela
- [ ] **1.5** Testar isolamento de tenant (não deve ver dados de outro tenant)
- [ ] **1.6** Testar permissões por role (viewer não deve modificar dados)

### Fase 2: Funções RPC Seguras (🟠 Alta)

- [ ] **2.1** Criar RPC `create_tenant_with_admin`
- [ ] **2.2** Criar RPC `manage_user` (criar/editar/excluir)
- [ ] **2.3** Migrar lógica de gestão do frontend para RPCs
- [ ] **2.4** Adicionar validação de permissões nas RPCs

### Fase 3: Melhorias de Infraestrutura (🟡 Média)

- [ ] **3.1** Configurar rate limiting
- [ ] **3.2** Criar tabela `audit_logs`
- [ ] **3.3** Implementar triggers de auditoria
- [ ] **3.4** Configurar backups automatizados

---

## 📝 Instruções Detalhadas

### 1. Verificar RLS em Todas as Tabelas

**Onde**: Supabase Dashboard → SQL Editor

```sql
-- Execute esta query para listar status RLS de todas as tabelas
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Ativo' ELSE '❌ DESATIVADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;
```

**Ação se RLS desativado**:
```sql
ALTER TABLE public.NOME_DA_TABELA ENABLE ROW LEVEL SECURITY;
```

---

### 2. Criar Funções Auxiliares

**Onde**: Supabase Dashboard → SQL Editor

#### 2.1 Função has_role
```sql
-- Verifica se usuário tem determinada role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
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
      AND role = _role::app_role
  )
$$;
```

#### 2.2 Função get_user_tenant_id
```sql
-- Retorna tenant_id do usuário (evita recursão em policies)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.profiles 
  WHERE id = _user_id
$$;
```

---

### 3. Policies por Tabela

#### 3.1 tenants

```sql
-- Remover policies existentes (se houver)
DROP POLICY IF EXISTS "tenants_select" ON tenants;
DROP POLICY IF EXISTS "tenants_insert" ON tenants;
DROP POLICY IF EXISTS "tenants_update" ON tenants;
DROP POLICY IF EXISTS "tenants_delete" ON tenants;

-- SELECT: master_admin vê todos, outros veem apenas o próprio
CREATE POLICY "tenants_select" ON tenants
FOR SELECT USING (
  public.has_role(auth.uid(), 'master_admin')
  OR id = public.get_user_tenant_id(auth.uid())
);

-- INSERT/UPDATE/DELETE: apenas master_admin
CREATE POLICY "tenants_insert" ON tenants
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "tenants_update" ON tenants
FOR UPDATE USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "tenants_delete" ON tenants
FOR DELETE USING (public.has_role(auth.uid(), 'master_admin'));
```

#### 3.2 profiles

```sql
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- SELECT: usuários do mesmo tenant
CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- UPDATE: apenas o próprio perfil
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (id = auth.uid());
```

#### 3.3 user_roles

```sql
DROP POLICY IF EXISTS "user_roles_select" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON user_roles;

-- SELECT: própria role ou admin/master_admin do tenant
CREATE POLICY "user_roles_select" ON user_roles
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'master_admin')
  OR (
    public.has_role(auth.uid(), 'admin') 
    AND EXISTS (
      SELECT 1 FROM profiles p1 
      JOIN profiles p2 ON p1.tenant_id = p2.tenant_id
      WHERE p1.id = auth.uid() AND p2.id = user_id
    )
  )
);

-- INSERT/UPDATE/DELETE: admin ou master_admin
CREATE POLICY "user_roles_modify" ON user_roles
FOR ALL USING (
  public.has_role(auth.uid(), 'master_admin')
  OR public.has_role(auth.uid(), 'admin')
);
```

#### 3.4 agents

```sql
DROP POLICY IF EXISTS "agents_all" ON agents;

CREATE POLICY "agents_all" ON agents
FOR ALL USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
```

#### 3.5 conversations

```sql
DROP POLICY IF EXISTS "conversations_all" ON conversations;

CREATE POLICY "conversations_all" ON conversations
FOR ALL USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
```

#### 3.6 messages

```sql
DROP POLICY IF EXISTS "messages_all" ON messages;

CREATE POLICY "messages_all" ON messages
FOR ALL USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
```

#### 3.7 contacts

```sql
DROP POLICY IF EXISTS "contacts_all" ON contacts;

CREATE POLICY "contacts_all" ON contacts
FOR ALL USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
```

---

### 4. RPC para Criar Tenant com Admin

```sql
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  p_tenant_name text,
  p_admin_email text,
  p_admin_password text,
  p_admin_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  -- Verificar se é master_admin
  IF NOT public.has_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Permissão negada: apenas master_admin pode criar tenants';
  END IF;

  -- Validar inputs
  IF length(p_tenant_name) < 2 THEN
    RAISE EXCEPTION 'Nome do tenant deve ter no mínimo 2 caracteres';
  END IF;

  IF length(p_admin_password) < 6 THEN
    RAISE EXCEPTION 'Senha deve ter no mínimo 6 caracteres';
  END IF;

  -- Criar tenant
  INSERT INTO tenants (name, plan)
  VALUES (p_tenant_name, 'free')
  RETURNING id INTO v_tenant_id;

  -- Criar usuário (via auth.users - requer edge function)
  -- Esta parte deve ser feita via Edge Function
  
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'message', 'Tenant criado. Usuário deve ser criado via Edge Function.'
  );
END;
$$;
```

---

### 5. Tabela de Auditoria

```sql
-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  tenant_id uuid REFERENCES tenants(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: apenas admins do tenant podem ver logs
CREATE POLICY "audit_logs_select" ON audit_logs
FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'master_admin')
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Índices para performance
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
```

---

### 6. Trigger de Auditoria

```sql
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    tenant_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em tabelas sensíveis
CREATE TRIGGER audit_agents
  AFTER INSERT OR UPDATE OR DELETE ON agents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## 🧪 Testes de Validação

### Teste 1: Isolamento de Tenant

```sql
-- Como usuário do Tenant A, tentar ver dados do Tenant B
-- Deve retornar 0 registros

-- 1. Anote o tenant_id do usuário atual
SELECT tenant_id FROM profiles WHERE id = auth.uid();

-- 2. Tente buscar conversas de outro tenant
SELECT * FROM conversations WHERE tenant_id != 'SEU_TENANT_ID';
-- Resultado esperado: 0 linhas (RLS bloqueou)
```

### Teste 2: Permissões de Role

```sql
-- Como viewer, tentar inserir um agente
-- Deve falhar com erro de permissão

INSERT INTO agents (name, tenant_id, is_active)
VALUES ('Teste', 'SEU_TENANT_ID', true);
-- Resultado esperado: erro de RLS
```

### Teste 3: Escalonamento de Privilégio

```sql
-- Como admin, tentar se tornar master_admin
-- Deve falhar

UPDATE user_roles 
SET role = 'master_admin' 
WHERE user_id = auth.uid();
-- Resultado esperado: erro ou nenhuma linha afetada
```

---

## 📊 Relatório de Auditoria

Preencha após executar cada item:

| # | Tarefa | Status | Responsável | Data |
|---|--------|--------|-------------|------|
| 1.1 | RLS habilitado em todas tabelas | ⬜ | | |
| 1.2 | Função has_role criada | ⬜ | | |
| 1.3 | Função get_user_tenant_id criada | ⬜ | | |
| 1.4 | Policies de tenants | ⬜ | | |
| 1.5 | Policies de profiles | ⬜ | | |
| 1.6 | Policies de user_roles | ⬜ | | |
| 1.7 | Policies de agents | ⬜ | | |
| 1.8 | Policies de conversations | ⬜ | | |
| 1.9 | Policies de messages | ⬜ | | |
| 1.10 | Policies de contacts | ⬜ | | |
| 2.1 | RPC create_tenant_with_admin | ⬜ | | |
| 2.2 | RPC manage_user | ⬜ | | |
| 3.1 | Tabela audit_logs | ⬜ | | |
| 3.2 | Triggers de auditoria | ⬜ | | |
| T1 | Teste isolamento tenant | ⬜ | | |
| T2 | Teste permissões role | ⬜ | | |
| T3 | Teste escalonamento | ⬜ | | |

---

## ⏱️ Estimativa de Tempo

| Fase | Estimativa | Prioridade |
|------|------------|------------|
| Fase 1: Auditoria RLS | 2-4 horas | 🔴 Crítica |
| Fase 2: RPCs Seguras | 4-6 horas | 🟠 Alta |
| Fase 3: Auditoria/Logs | 2-3 horas | 🟡 Média |
| Testes de Validação | 1-2 horas | 🔴 Crítica |
| **Total** | **9-15 horas** | |

---

## 🔗 Referências

- [docs/PERMISSIONS.md](./PERMISSIONS.md) - Matriz de permissões
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [docs/RLS_AUDIT_CHECKLIST.md](./RLS_AUDIT_CHECKLIST.md) - Checklist detalhado RLS
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
