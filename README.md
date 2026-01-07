# Inguz.Tech - Plataforma de Atendimento WhatsApp

Sistema de gestão de conversas WhatsApp com agentes de IA para atendimento automatizado.

## 🚀 Visão Geral

Esta aplicação permite gerenciar conversas de WhatsApp através de agentes de IA, com dashboard analítico, gestão de contatos e administração multi-tenant.

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── analytics/        # Componentes de analytics
│   ├── conversations/    # Chat, lista de conversas, detalhes
│   ├── layout/           # Header, navegação
│   ├── settings/         # Gestão de tenants e usuários
│   └── ui/               # Componentes base (shadcn/ui)
├── contexts/
│   └── AuthContext.tsx   # Contexto de autenticação
├── hooks/
│   ├── useAgents.ts              # Hook para agentes
│   ├── useAgentStats.ts          # Estatísticas de agentes
│   ├── useContactDetails.ts      # Detalhes de contato
│   ├── useConversationContent.ts # Mensagens da conversa
│   ├── useConversationsList.ts   # Lista de conversas
│   ├── useDashboardMetrics.ts    # Métricas do dashboard
│   └── useGraphData.ts           # Dados para gráficos
├── lib/
│   ├── analytics.ts      # Tracking de eventos
│   ├── supabase.ts       # Cliente Supabase
│   ├── utils.ts          # Utilitários
│   └── validations.ts    # Schemas Zod
├── pages/
│   ├── Agents.tsx        # Gestão de agentes
│   ├── Conversations.tsx # Tela de conversas
│   ├── Dashboard.tsx     # Dashboard principal
│   ├── Landing.tsx       # Página inicial
│   ├── Login.tsx         # Autenticação
│   ├── Settings.tsx      # Configurações
│   └── Signup.tsx        # Cadastro
└── docs/
    ├── ARCHITECTURE.md   # Decisões técnicas
    └── PERMISSIONS.md    # Matriz de permissões
```

## 🛠 Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Estilização | Tailwind CSS, shadcn/ui |
| Estado | TanStack Query (React Query) |
| Formulários | React Hook Form + Zod |
| Animações | Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Gráficos | Recharts |

## 🔧 Configuração Local

### Pré-requisitos

- Node.js 18+ 
- npm ou bun

### Instalação

```bash
# Clonar repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

O projeto utiliza Supabase. Configure as variáveis no arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

## 🔐 Segurança

### Validação de Formulários

Todos os formulários utilizam validação Zod:

```typescript
import { loginSchema } from '@/lib/validations';

// Schemas disponíveis:
// - loginSchema
// - signupSchema
// - tenantSchema
// - createUserSchema
// - updateUserSchema
```

### Isolamento de Tenant

Todas as queries incluem filtro `tenant_id` para garantir isolamento de dados entre organizações.

### Row Level Security (RLS)

O banco de dados utiliza RLS para proteção em nível de linha. Veja `docs/PERMISSIONS.md` para detalhes.

## 📊 Testes

```bash
# Executar testes unitários
npm run test

# Modo watch
npx vitest
```

Os testes de validação estão em `src/lib/__tests__/validations.test.ts`.

## 📚 Documentação Adicional

- [Arquitetura](./docs/ARCHITECTURE.md) - Decisões técnicas e padrões
- [Permissões](./docs/PERMISSIONS.md) - Matriz de permissões por role

## 🚀 Deploy

O deploy é feito automaticamente via Lovable:

1. Abra o [projeto no Lovable](https://lovable.dev/projects/4b5b4662-2edb-4850-be9e-6a7b64007562)
2. Clique em **Share → Publish**

Para domínio personalizado: **Project → Settings → Domains**

## 📄 Licença

Projeto privado - Todos os direitos reservados.
