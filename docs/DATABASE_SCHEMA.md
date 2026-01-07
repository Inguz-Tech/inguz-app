# Inguz.Tech - Schema de Dados

Documentação completa do schema de dados do sistema de atendimento WhatsApp.

## 📊 Diagrama ER (Entity Relationship)

```mermaid
erDiagram
    tenants ||--o{ profiles : "has"
    tenants ||--o{ agents : "has"
    tenants ||--o{ contacts : "has"
    tenants ||--o{ conversations : "has"
    tenants ||--o{ messages : "has"
    
    profiles ||--o| user_roles : "has"
    profiles }o--|| auth_users : "references"
    
    agents ||--o{ conversations : "handles"
    contacts ||--o{ conversations : "participates"
    conversations ||--o{ messages : "contains"
    
    tenants {
        uuid id PK
        string name
        enum plan
        timestamp created_at
    }
    
    profiles {
        uuid id PK_FK
        string full_name
        uuid tenant_id FK
        timestamp created_at
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        enum role
    }
    
    agents {
        uuid id PK
        string name
        string description
        uuid tenant_id FK
        string whatsapp_number
    }
    
    contacts {
        uuid id PK
        string name
        string phone
        string status
        array tags
        jsonb variables
        uuid tenant_id FK
    }
    
    conversations {
        uuid id PK
        uuid contact_id FK
        uuid agent_id FK
        uuid tenant_id FK
        timestamp last_message_at
    }
    
    messages {
        uuid id PK
        uuid conversation_id FK
        uuid tenant_id FK
        text content
        timestamp timestamp
        enum sender_type
        string message_type
    }
```

---

## 📋 Detalhamento das Tabelas

### 1. `tenants`

Tabela central para isolamento multi-tenant. Cada organização é um tenant.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Chave primária |
| `name` | `text` | NOT NULL | - | Nome da organização |
| `plan` | `plan` | NOT NULL | `'free'` | Plano: free ou premium |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` | Data de criação |

**Índices:**
- `tenants_pkey` - PRIMARY KEY (id)

**RLS Policies:**
- SELECT: Usuários veem apenas seu próprio tenant
- INSERT: Apenas master_admin pode criar
- UPDATE: Apenas admin+ pode atualizar seu tenant
- DELETE: Apenas master_admin pode deletar

---

### 2. `profiles`

Perfil de usuário vinculado ao auth.users do Supabase.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | - | PK e FK para auth.users(id) |
| `full_name` | `text` | NULL | - | Nome completo do usuário |
| `tenant_id` | `uuid` | NOT NULL | - | FK para tenants(id) |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` | Data de criação |

**Índices:**
- `profiles_pkey` - PRIMARY KEY (id)
- `profiles_tenant_id_idx` - INDEX (tenant_id)

**Foreign Keys:**
- `profiles_id_fkey` → `auth.users(id)` ON DELETE CASCADE
- `profiles_tenant_id_fkey` → `tenants(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Usuários veem profiles do mesmo tenant
- UPDATE: Usuários podem atualizar apenas seu próprio profile

---

### 3. `user_roles`

Roles de usuário separados do profile por segurança.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Chave primária |
| `user_id` | `uuid` | NOT NULL | - | FK para profiles(id) |
| `role` | `app_role` | NOT NULL | - | Role do usuário |

**Índices:**
- `user_roles_pkey` - PRIMARY KEY (id)
- `user_roles_user_id_role_key` - UNIQUE (user_id, role)

**Foreign Keys:**
- `user_roles_user_id_fkey` → `profiles(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Usuários podem ver roles do mesmo tenant
- INSERT/UPDATE/DELETE: Apenas admin+ pode gerenciar roles

---

### 4. `agents`

Agentes de atendimento (bots/assistentes).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Chave primária |
| `name` | `text` | NOT NULL | - | Nome do agente |
| `description` | `text` | NULL | - | Descrição do agente |
| `tenant_id` | `uuid` | NOT NULL | - | FK para tenants(id) |
| `whatsapp_number` | `text` | NULL | - | Número WhatsApp do agente |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` | Data de criação |

**Índices:**
- `agents_pkey` - PRIMARY KEY (id)
- `agents_tenant_id_idx` - INDEX (tenant_id)

**Foreign Keys:**
- `agents_tenant_id_fkey` → `tenants(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Usuários veem agentes do seu tenant
- INSERT/UPDATE/DELETE: Apenas admin+ pode gerenciar

---

### 5. `contacts`

Contatos (clientes) do WhatsApp.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Chave primária |
| `name` | `text` | NULL | - | Nome do contato |
| `phone` | `text` | NOT NULL | - | Número de telefone |
| `status` | `text` | NULL | `'active'` | Status do contato |
| `tags` | `text[]` | NULL | `'{}'` | Tags para categorização |
| `variables` | `jsonb` | NULL | `'{}'` | Variáveis customizadas |
| `tenant_id` | `uuid` | NOT NULL | - | FK para tenants(id) |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` | Data de criação |

**Índices:**
- `contacts_pkey` - PRIMARY KEY (id)
- `contacts_tenant_id_idx` - INDEX (tenant_id)
- `contacts_phone_tenant_idx` - UNIQUE (phone, tenant_id)

**Foreign Keys:**
- `contacts_tenant_id_fkey` → `tenants(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Usuários veem contatos do seu tenant
- INSERT/UPDATE/DELETE: Apenas admin+ pode gerenciar

---

### 6. `conversations`

Conversas entre agentes e contatos.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Chave primária |
| `contact_id` | `uuid` | NOT NULL | - | FK para contacts(id) |
| `agent_id` | `uuid` | NOT NULL | - | FK para agents(id) |
| `tenant_id` | `uuid` | NOT NULL | - | FK para tenants(id) |
| `last_message_at` | `timestamp with time zone` | NULL | `now()` | Timestamp da última mensagem |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` | Data de criação |

**Índices:**
- `conversations_pkey` - PRIMARY KEY (id)
- `conversations_tenant_id_idx` - INDEX (tenant_id)
- `conversations_contact_id_idx` - INDEX (contact_id)
- `conversations_agent_id_idx` - INDEX (agent_id)
- `conversations_last_message_at_idx` - INDEX (last_message_at DESC)

**Foreign Keys:**
- `conversations_contact_id_fkey` → `contacts(id)` ON DELETE CASCADE
- `conversations_agent_id_fkey` → `agents(id)` ON DELETE CASCADE
- `conversations_tenant_id_fkey` → `tenants(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Usuários veem conversas do seu tenant
- INSERT/UPDATE: Sistema pode criar/atualizar

---

### 7. `messages`

Mensagens das conversas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Chave primária |
| `conversation_id` | `uuid` | NOT NULL | - | FK para conversations(id) |
| `tenant_id` | `uuid` | NOT NULL | - | FK para tenants(id) |
| `content` | `text` | NOT NULL | - | Conteúdo da mensagem |
| `timestamp` | `timestamp with time zone` | NOT NULL | `now()` | Timestamp da mensagem |
| `sender_type` | `sender_type` | NOT NULL | - | Tipo: 'Agent' ou 'CLIENT' |
| `message_type` | `text` | NULL | `'text'` | Tipo: text, image, audio, etc |

**Índices:**
- `messages_pkey` - PRIMARY KEY (id)
- `messages_conversation_id_idx` - INDEX (conversation_id)
- `messages_tenant_id_idx` - INDEX (tenant_id)
- `messages_timestamp_idx` - INDEX (timestamp DESC)

**Foreign Keys:**
- `messages_conversation_id_fkey` → `conversations(id)` ON DELETE CASCADE
- `messages_tenant_id_fkey` → `tenants(id)` ON DELETE CASCADE

**RLS Policies:**
- SELECT: Usuários veem mensagens do seu tenant
- INSERT: Sistema pode inserir mensagens

---

## 🔤 Tipos Enum

### `app_role`
```sql
CREATE TYPE public.app_role AS ENUM (
  'master_admin',  -- Administrador global (acesso total)
  'admin',         -- Administrador do tenant
  'viewer'         -- Visualizador (somente leitura)
);
```

### `plan`
```sql
CREATE TYPE public.plan AS ENUM (
  'free',     -- Plano gratuito
  'premium'   -- Plano premium
);
```

### `sender_type`
```sql
CREATE TYPE public.sender_type AS ENUM (
  'Agent',   -- Mensagem enviada pelo agente/bot
  'CLIENT'   -- Mensagem enviada pelo cliente
);
```

---

## ⚙️ Funções RPC

### `get_dashboard_metrics`

Retorna métricas agregadas para o dashboard.

```sql
get_dashboard_metrics(
  p_tenant_id uuid,
  p_days_back integer DEFAULT 7
) RETURNS TABLE (
  total_conversations bigint,
  total_messages bigint,
  total_contacts bigint,
  messages_sent bigint,
  messages_received bigint
)
```

**Parâmetros:**
- `p_tenant_id`: ID do tenant
- `p_days_back`: Número de dias para análise (default: 7)

---

### `get_messages_graph_data`

Retorna dados agregados por período para gráficos.

```sql
get_messages_graph_data(
  p_tenant_id uuid,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone,
  p_trunc_type text DEFAULT 'day'
) RETURNS TABLE (
  period text,
  sent bigint,
  received bigint
)
```

**Parâmetros:**
- `p_tenant_id`: ID do tenant
- `p_start_date`: Data inicial
- `p_end_date`: Data final
- `p_trunc_type`: Tipo de truncamento ('hour' ou 'day')

---

### `has_role`

Verifica se usuário possui determinada role.

```sql
has_role(
  _user_id uuid,
  _role app_role
) RETURNS boolean
```

**Características:**
- `SECURITY DEFINER`: Executa com privilégios do owner
- Evita recursão em RLS policies
- Usada em todas as policies de permissão

---

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com policies que:
1. Filtram por `tenant_id` para isolamento multi-tenant
2. Usam `has_role()` para verificar permissões
3. São SECURITY DEFINER para evitar recursão

### Função Auxiliar

```sql
CREATE OR REPLACE FUNCTION get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE id = _user_id
$$;
```

---

## 📈 Índices Recomendados

Para otimização de queries frequentes:

```sql
-- Busca de conversas por tenant e data
CREATE INDEX IF NOT EXISTS conversations_tenant_date_idx 
ON conversations (tenant_id, last_message_at DESC);

-- Busca de mensagens por conversa e data
CREATE INDEX IF NOT EXISTS messages_conversation_timestamp_idx 
ON messages (conversation_id, timestamp DESC);

-- Busca de contatos por telefone
CREATE INDEX IF NOT EXISTS contacts_phone_idx 
ON contacts (phone);
```

---

## 📅 Última Atualização

Documento gerado em: Janeiro 2026
