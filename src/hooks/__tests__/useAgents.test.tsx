import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAgents } from '../useAgents';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

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

describe('useAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when tenantId is undefined', async () => {
    const { result } = renderHook(() => useAgents(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should fetch agents when tenantId is provided', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Agente 1',
        description: 'Descrição do agente 1',
        tenant_id: 'tenant-123',
        whatsapp_number: '5511999999999',
      },
      {
        id: 'agent-2',
        name: 'Agente 2',
        description: null,
        tenant_id: 'tenant-123',
        whatsapp_number: '5511888888888',
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useAgents('tenant-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.from).toHaveBeenCalledWith('agents');
    expect(mockSelect).toHaveBeenCalledWith('id, name, description, tenant_id, whatsapp_number');
    expect(result.current.data).toEqual(mockAgents);
  });

  it('should handle error when fetching agents fails', async () => {
    const mockError = { message: 'Database error' };

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useAgents('tenant-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Erro ao buscar agentes');
  });

  it('should return empty array when no agents exist', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useAgents('tenant-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should return empty array when data is null', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useAgents('tenant-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
