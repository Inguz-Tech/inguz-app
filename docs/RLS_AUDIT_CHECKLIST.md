# Checklist de Auditoria RLS - Supabase

## ⚠️ Status: Pendente Revisão Manual

O Supabase deste projeto é externo e requer auditoria manual no Dashboard.

---

## 📋 Checklist por Tabela

### 1. tenants
- [ ] RLS habilitado (`ALTER TABLE tenants ENABLE ROW LEVEL SECURITY`)
- [ ] Policy SELECT: `master_admin` vê todos, outros veem apenas o próprio tenant
- [ ] Policy INSERT/UPDATE/DELETE: apenas `master_admin`

```sql
-- Verificar policies existentes
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```

### 2. profiles
- [ ] RLS habilitado
- [ ] Policy SELECT: usuários do mesmo tenant podem ver
- [ ] Policy UPDATE: usuário pode atualizar apenas o próprio perfil
- [ ] Trigger `on_auth_user_created` existe e está funcionando

```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verificar trigger
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
```

### 3. user_roles
- [ ] RLS habilitado
- [ ] Policy SELECT: usuário vê própria role OU admin/master_admin do tenant
- [ ] Policy INSERT/UPDATE/DELETE: apenas admin/master_admin

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```

### 4. agents
- [ ] RLS habilitado
- [ ] Policy ALL: `tenant_id` = tenant do usuário autenticado

```sql
SELECT * FROM pg_policies WHERE tablename = 'agents';
```

### 5. conversations
- [ ] RLS habilitado
- [ ] Policy SELECT: `tenant_id` = tenant do usuário autenticado
- [ ] Policy INSERT/UPDATE: se aplicável, restrito por tenant

```sql
SELECT * FROM pg_policies WHERE tablename = 'conversations';
```

### 6. messages
- [ ] RLS habilitado
- [ ] Policy SELECT: `tenant_id` = tenant do usuário autenticado
- [ ] Policy INSERT: se aplicável, restrito por tenant

```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### 7. contacts
- [ ] RLS habilitado
- [ ] Policy SELECT: `tenant_id` = tenant do usuário autenticado
- [ ] Policy INSERT/UPDATE/DELETE: restrito por tenant

```sql
SELECT * FROM pg_policies WHERE tablename = 'contacts';
```

---

## 🔐 Função has_role

Verifique se a função existe e está correta:

```sql
-- Verificar se existe
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'has_role';

-- Se não existir, criar:
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

---

## 🔄 Função get_user_tenant_id

Para evitar recursão infinita, crie função auxiliar:

```sql
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

## 📊 Query de Auditoria Completa

Execute no SQL Editor do Supabase:

```sql
-- Listar todas as tabelas e status RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Listar todas as policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## ⚠️ Problemas Comuns a Verificar

### 1. Recursão Infinita
**Errado:**
```sql
CREATE POLICY "bad_policy" ON profiles
FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

**Correto:**
```sql
CREATE POLICY "good_policy" ON profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

### 2. Tabelas sem RLS
```sql
-- Encontrar tabelas públicas sem RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

### 3. Policies muito permissivas
Verifique policies com `USING (true)` ou sem filtro de tenant.

---

## ✅ Exemplo de Policies Corretas

### tenants
```sql
-- SELECT
CREATE POLICY "tenants_select" ON tenants FOR SELECT USING (
  public.has_role(auth.uid(), 'master_admin')
  OR id = public.get_user_tenant_id(auth.uid())
);

-- INSERT/UPDATE/DELETE
CREATE POLICY "tenants_admin_only" ON tenants 
FOR ALL USING (public.has_role(auth.uid(), 'master_admin'));
```

### agents
```sql
CREATE POLICY "agents_tenant_isolation" ON agents
FOR ALL USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
```

### conversations
```sql
CREATE POLICY "conversations_tenant_isolation" ON conversations
FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
```

---

## 📝 Resultado da Auditoria

| Tabela | RLS Ativo | Policies OK | Notas |
|--------|:---------:|:-----------:|-------|
| tenants | ⬜ | ⬜ | |
| profiles | ⬜ | ⬜ | |
| user_roles | ⬜ | ⬜ | |
| agents | ⬜ | ⬜ | |
| conversations | ⬜ | ⬜ | |
| messages | ⬜ | ⬜ | |
| contacts | ⬜ | ⬜ | |

**Auditor:** _______________  
**Data:** _______________  
**Status:** ⬜ Aprovado / ⬜ Requer Correções

---

## 🔗 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [docs/PERMISSIONS.md](./PERMISSIONS.md) - Matriz de permissões do sistema
