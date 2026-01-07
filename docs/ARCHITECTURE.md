# Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Pages          │  Components       │  Hooks               │
│  - Dashboard    │  - ConversationList│  - useConversations  │
│  - Conversations│  - ChatArea        │  - useAgents         │
│  - Agents       │  - ContactDetails  │  - useDashboardMetrics│
│  - Settings     │  - Header          │  - useGraphData      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│  Auth           │  Database          │  RPC Functions      │
│  - Email/Pass   │  - tenants         │  - get_dashboard_   │
│  - Session      │  - profiles        │    metrics          │
│                 │  - user_roles      │  - get_messages_    │
│                 │  - agents          │    graph_data       │
│                 │  - conversations   │                     │
│                 │  - messages        │                     │
│                 │  - contacts        │                     │
└─────────────────────────────────────────────────────────────┘
```

## Decisões Técnicas

### 1. Estado Global vs Local

| Tipo | Gerenciamento | Uso |
|------|---------------|-----|
| Autenticação | Context API | Sessão do usuário, profile, tenant |
| Dados do servidor | TanStack Query | Conversas, agentes, métricas |
| Estado de UI | useState local | Formulários, modais, seleções |

**Justificativa**: TanStack Query oferece cache automático, refetch em background e tratamento de loading/error states, reduzindo boilerplate e melhorando UX.

### 2. Validação de Formulários

```
Zod Schemas → React Hook Form → Componentes de UI
```

- **Schemas centralizados** em `src/lib/validations.ts`
- **Validação client-side** com feedback visual imediato
- **Sanitização** automática (trim, limites de caracteres)

### 3. Isolamento de Tenant

Todas as queries de dados incluem filtro `tenant_id`:

```typescript
// Hook pattern
const { profile } = useAuth();
const tenantId = profile?.tenant_id;

// Query com filtro
.eq('tenant_id', tenantId)
```

**Importante**: Este é um filtro client-side. A segurança real é garantida por RLS no Supabase.

### 4. Componentes de Estado

| Componente | Uso |
|------------|-----|
| `LoadingState` | Exibição durante carregamento |
| `ErrorState` | Erros com opção de retry |
| `EmptyState` | Listas vazias |
| `ErrorBoundary` | Captura erros não tratados |

Todos utilizam Framer Motion para animações suaves.

### 5. Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # Componentes base reutilizáveis
│   ├── conversations/   # Feature: conversas
│   ├── settings/        # Feature: configurações
│   └── layout/          # Layout global
├── hooks/               # Custom hooks (data fetching)
├── contexts/            # React Contexts
├── pages/               # Componentes de página
└── lib/                 # Utilitários e configurações
```

**Princípios**:
- Componentes pequenos e focados
- Hooks para lógica de dados
- Separação por feature

## Fluxo de Dados

### Autenticação

```
1. Login → Supabase Auth
2. onAuthStateChange → fetchProfileAndTenant
3. Profile + Role + Tenant → Context
4. ProtectedRoute verifica sessão
```

### Carregamento de Conversas

```
1. useConversationsList (com tenant_id)
2. TanStack Query cache
3. Render lista
4. Seleção → useConversationContent
5. Render mensagens
```

## Padrões de Código

### Hooks de Dados

```typescript
export const useExample = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['example', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        throw new Error(`Erro: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!tenantId,
  });
};
```

### Formulários

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

const onSubmit = async (data: FormData) => {
  // Dados já validados e sanitizados
};
```

## Performance

### Otimizações Implementadas

1. **Query caching**: staleTime de 5 minutos
2. **Retry limitado**: máximo 1 retry em falhas
3. **Lazy loading**: dados carregados sob demanda
4. **Skeleton states**: feedback visual imediato

### Melhorias Futuras

- [ ] Virtualização de listas longas
- [ ] Prefetch de dados
- [ ] Service Worker para offline
