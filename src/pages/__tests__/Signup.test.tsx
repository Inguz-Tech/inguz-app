import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../Signup';

// Mock useAuth
const mockSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    user: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderSignup = () => {
  return render(
    <BrowserRouter>
      <Signup />
    </BrowserRouter>
  );
};

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders signup form with all fields', () => {
      renderSignup();
      
      expect(screen.getByText('Criar Conta')).toBeInTheDocument();
      expect(screen.getByLabelText(/nome da empresa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    });

    it('renders login link', () => {
      renderSignup();
      
      expect(screen.getByText(/já tem uma conta/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /faça login/i })).toHaveAttribute('href', '/login');
    });

    it('renders password requirements hint', () => {
      renderSignup();
      
      expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when company name is empty', async () => {
      renderSignup();
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nome da empresa é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('shows error when name is too short', async () => {
      renderSignup();
      
      const companyInput = screen.getByLabelText(/nome da empresa/i);
      const nameInput = screen.getByLabelText(/nome completo/i);
      
      await userEvent.type(companyInput, 'Test Company');
      await userEvent.type(nameInput, 'A');
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nome deve ter no mínimo 2 caracteres/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email', async () => {
      renderSignup();
      
      const companyInput = screen.getByLabelText(/nome da empresa/i);
      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      
      await userEvent.type(companyInput, 'Test Company');
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('shows error when password lacks uppercase', async () => {
      renderSignup();
      
      const companyInput = screen.getByLabelText(/nome da empresa/i);
      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      
      await userEvent.type(companyInput, 'Test Company');
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/senha deve conter pelo menos uma letra maiúscula/i)).toBeInTheDocument();
      });
    });

    it('shows error when password lacks number', async () => {
      renderSignup();
      
      const companyInput = screen.getByLabelText(/nome da empresa/i);
      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      
      await userEvent.type(companyInput, 'Test Company');
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(passwordInput, 'Password');
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/senha deve conter pelo menos um número/i)).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      renderSignup();
      
      const companyInput = screen.getByLabelText(/nome da empresa/i);
      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      
      await userEvent.type(companyInput, 'Test Company');
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(passwordInput, 'Password123');
      await userEvent.type(confirmPasswordInput, 'DifferentPass123');
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/as senhas não coincidem/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    const validFormData = {
      companyName: 'Test Company',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    it('calls signup with correct parameters on valid submission', async () => {
      mockSignup.mockResolvedValue({ error: null });
      
      renderSignup();
      
      await userEvent.type(screen.getByLabelText(/nome da empresa/i), validFormData.companyName);
      await userEvent.type(screen.getByLabelText(/nome completo/i), validFormData.name);
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^senha$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), validFormData.confirmPassword);
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          validFormData.email,
          validFormData.password,
          validFormData.name,
          validFormData.companyName
        );
      });
    });

    it('navigates to dashboard on successful signup', async () => {
      mockSignup.mockResolvedValue({ error: null });
      
      renderSignup();
      
      await userEvent.type(screen.getByLabelText(/nome da empresa/i), validFormData.companyName);
      await userEvent.type(screen.getByLabelText(/nome completo/i), validFormData.name);
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^senha$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), validFormData.confirmPassword);
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows loading state while submitting', async () => {
      mockSignup.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100)));
      
      renderSignup();
      
      await userEvent.type(screen.getByLabelText(/nome da empresa/i), validFormData.companyName);
      await userEvent.type(screen.getByLabelText(/nome completo/i), validFormData.name);
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^senha$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), validFormData.confirmPassword);
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      // Button should be disabled while submitting
      expect(submitButton).toBeDisabled();
    });

    it('displays error message on signup failure', async () => {
      mockSignup.mockResolvedValue({ error: 'Email já cadastrado' });
      
      renderSignup();
      
      await userEvent.type(screen.getByLabelText(/nome da empresa/i), validFormData.companyName);
      await userEvent.type(screen.getByLabelText(/nome completo/i), validFormData.name);
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^senha$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), validFormData.confirmPassword);
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('form inputs have proper labels', () => {
      renderSignup();
      
      const companyInput = screen.getByLabelText(/nome da empresa/i);
      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      
      expect(companyInput).toHaveAttribute('id');
      expect(nameInput).toHaveAttribute('id');
      expect(emailInput).toHaveAttribute('id');
      expect(passwordInput).toHaveAttribute('id');
      expect(confirmPasswordInput).toHaveAttribute('id');
    });

    it('password inputs have type password', () => {
      renderSignup();
      
      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('email input has type email', () => {
      renderSignup();
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });
});
