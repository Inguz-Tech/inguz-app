import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDashboardMetrics } from '../useDashboardMetrics';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
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

describe('useDashboardMetrics', () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return zero metrics when tenantId is undefined', async () => {
    const { result } = renderHook(
      () => useDashboardMetrics(undefined, startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      totalConversations: 0,
      messagesSent: 0,
      messagesReceived: 0,
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('should fetch metrics when tenantId is provided', async () => {
    const mockMetrics = {
      total_conversations: 150,
      messages_sent: 500,
      messages_received: 450,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockMetrics],
      error: null,
    } as any);

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_metrics', {
      p_tenant_id: 'tenant-123',
      p_days_back: 30,
    });

    expect(result.current.data).toEqual({
      totalConversations: 150,
      messagesSent: 500,
      messagesReceived: 450,
    });
  });

  it('should handle RPC returning single object instead of array', async () => {
    const mockMetrics = {
      total_conversations: 100,
      messages_sent: 300,
      messages_received: 250,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockMetrics,
      error: null,
    } as any);

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      totalConversations: 100,
      messagesSent: 300,
      messagesReceived: 250,
    });
  });

  it('should handle error when fetching metrics fails', async () => {
    const mockError = { message: 'RPC function error' };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: mockError,
    } as any);

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Erro ao buscar métricas');
  });

  it('should handle null or missing values in response', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{}],
      error: null,
    } as any);

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      totalConversations: 0,
      messagesSent: 0,
      messagesReceived: 0,
    });
  });

  it('should handle empty array response', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as any);

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      totalConversations: 0,
      messagesSent: 0,
      messagesReceived: 0,
    });
  });

  it('should calculate correct days difference', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{ total_conversations: 0, messages_sent: 0, messages_received: 0 }],
      error: null,
    } as any);

    const start = new Date('2024-01-01');
    const end = new Date('2024-01-08'); // 7 days

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', start, end),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_metrics', {
      p_tenant_id: 'tenant-123',
      p_days_back: 7,
    });
  });

  it('should handle partial metrics data', async () => {
    const mockMetrics = {
      total_conversations: 50,
      // messages_sent and messages_received are missing
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockMetrics],
      error: null,
    } as any);

    const { result } = renderHook(
      () => useDashboardMetrics('tenant-123', startDate, endDate),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      totalConversations: 50,
      messagesSent: 0,
      messagesReceived: 0,
    });
  });
});
