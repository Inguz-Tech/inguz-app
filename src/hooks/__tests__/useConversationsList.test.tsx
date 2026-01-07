import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useConversationsList } from '../useConversationsList';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConversationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when tenantId is undefined', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
    } as any);

    const { result } = renderHook(() => useConversationsList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should fetch conversations when tenantId is provided', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123' },
    } as any);

    const mockConversations = [
      {
        id: 'conv-1',
        contact_id: 'contact-1',
        last_message_at: '2024-01-15T10:00:00Z',
        tenant_id: 'tenant-123',
        contacts: { name: 'João Silva', phone: '5511999999999' },
        messages: [{ content: 'Olá!' }, { content: 'Tudo bem?' }],
      },
      {
        id: 'conv-2',
        contact_id: 'contact-2',
        last_message_at: '2024-01-14T15:30:00Z',
        tenant_id: 'tenant-123',
        contacts: { name: 'Maria Santos', phone: '5511888888888' },
        messages: [{ content: 'Bom dia' }],
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockConversations, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useConversationsList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.from).toHaveBeenCalledWith('conversations');
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toEqual({
      id: 'conv-1',
      contact_id: 'contact-1',
      contact_name: 'João Silva',
      contact_phone: '5511999999999',
      last_message_at: '2024-01-15T10:00:00Z',
      last_message_preview: 'Tudo bem?',
    });
  });

  it('should filter by agentId when provided', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123' },
    } as any);

    const mockConversations = [
      {
        id: 'conv-1',
        contact_id: 'contact-1',
        last_message_at: '2024-01-15T10:00:00Z',
        tenant_id: 'tenant-123',
        contacts: { name: 'João Silva', phone: '5511999999999' },
        messages: [],
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockConversations, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEqAgent = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqTenant = vi.fn().mockReturnValue({ order: mockOrder, eq: mockEqAgent });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqTenant });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useConversationsList('agent-456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockEqAgent).toHaveBeenCalledWith('agent_id', 'agent-456');
  });

  it('should handle missing contact name', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123' },
    } as any);

    const mockConversations = [
      {
        id: 'conv-1',
        contact_id: 'contact-1',
        last_message_at: '2024-01-15T10:00:00Z',
        tenant_id: 'tenant-123',
        contacts: null,
        messages: [],
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockConversations, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useConversationsList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].contact_name).toBe('Sem nome');
    expect(result.current.data?.[0].contact_phone).toBe('');
  });

  it('should handle error when fetching conversations fails', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123' },
    } as any);

    const mockError = { message: 'Database error' };

    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: mockError });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useConversationsList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Erro ao buscar conversas');
  });

  it('should handle empty messages array', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123' },
    } as any);

    const mockConversations = [
      {
        id: 'conv-1',
        contact_id: 'contact-1',
        last_message_at: '2024-01-15T10:00:00Z',
        tenant_id: 'tenant-123',
        contacts: { name: 'João Silva', phone: '5511999999999' },
        messages: [],
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockConversations, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useConversationsList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].last_message_preview).toBe('');
  });
});
