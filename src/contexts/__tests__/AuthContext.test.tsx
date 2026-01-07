import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Test component to access context
const TestComponent = () => {
  const { user, profile, tenant, role, isLoading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user?.email || 'no-user'}</div>
      <div data-testid="profile">{profile?.full_name || 'no-profile'}</div>
      <div data-testid="tenant">{tenant?.name || 'no-tenant'}</div>
      <div data-testid="role">{role || 'no-role'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
    
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      // Return unsubscribe function
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  describe('initial state', () => {
    it('starts with isLoading true', async () => {
      mockSupabase.auth.getSession.mockImplementation(() => new Promise(() => {}));
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('loading');
    });

    it('sets isLoading to false after session check', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('ready');
      });
    });
  });

  describe('unauthenticated state', () => {
    it('shows no user when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('no-user');
        expect(screen.getByTestId('profile').textContent).toBe('no-profile');
        expect(screen.getByTestId('tenant').textContent).toBe('no-tenant');
        expect(screen.getByTestId('role').textContent).toBe('no-role');
      });
    });
  });

  describe('authenticated state', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    const mockProfile = {
      id: 'user-123',
      full_name: 'Test User',
      tenant_id: 'tenant-456',
    };

    const mockRole = { role: 'admin' };
    
    const mockTenant = {
      id: 'tenant-456',
      name: 'Test Tenant',
      plan: 'premium',
    };

    beforeEach(() => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      mockSupabase.from.mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: table === 'profiles' ? mockProfile : 
                table === 'user_roles' ? mockRole : 
                table === 'tenants' ? mockTenant : null,
        }),
      }));
    });

    it('loads user data when authenticated', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleError.mockRestore();
    });
  });

  describe('login', () => {
    it('returns null error on successful login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: {}, user: {} },
        error: null,
      });

      let loginResult: { error: string | null } | undefined;

      const LoginTestComponent = () => {
        const { login } = useAuth();
        
        const handleLogin = async () => {
          loginResult = await login('test@example.com', 'password123');
        };
        
        return <button onClick={handleLogin}>Login</button>;
      };

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ error: null });
      });
    });

    it('returns error message on failed login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      });

      let loginResult: { error: string | null } | undefined;

      const LoginTestComponent = () => {
        const { login } = useAuth();
        
        const handleLogin = async () => {
          loginResult = await login('test@example.com', 'wrongpassword');
        };
        
        return <button onClick={handleLogin}>Login</button>;
      };

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(loginResult).toEqual({ error: 'Invalid credentials' });
      });
    });
  });

  describe('signup', () => {
    it('returns null error on successful signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { session: {}, user: {} },
        error: null,
      });

      let signupResult: { error: string | null } | undefined;

      const SignupTestComponent = () => {
        const { signup } = useAuth();
        
        const handleSignup = async () => {
          signupResult = await signup('new@example.com', 'Password123', 'New User', 'New Company');
        };
        
        return <button onClick={handleSignup}>Signup</button>;
      };

      render(
        <AuthProvider>
          <SignupTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Signup')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Signup').click();
      });

      await waitFor(() => {
        expect(signupResult).toEqual({ error: null });
      });
    });
  });

  describe('logout', () => {
    it('clears all user state on logout', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const LogoutTestComponent = () => {
        const { logout, user } = useAuth();
        
        return (
          <>
            <div data-testid="user">{user?.email || 'no-user'}</div>
            <button onClick={logout}>Logout</button>
          </>
        );
      };

      render(
        <AuthProvider>
          <LogoutTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByText('Logout').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('no-user');
      });
    });
  });
});
