import { z } from 'zod';

// ==================== Auth Schemas ====================

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'Email é obrigatório')
      .email('Email inválido')
      .max(255, 'Email deve ter no máximo 255 caracteres'),
    password: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .max(128, 'Senha deve ter no máximo 128 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// ==================== Tenant Schemas ====================

export const tenantSchema = z.object({
  tenant_name: z
    .string()
    .trim()
    .min(2, 'Nome do tenant deve ter no mínimo 2 caracteres')
    .max(100, 'Nome do tenant deve ter no máximo 100 caracteres'),
  admin_name: z
    .string()
    .trim()
    .min(2, 'Nome do admin deve ter no mínimo 2 caracteres')
    .max(100, 'Nome do admin deve ter no máximo 100 caracteres'),
  admin_email: z
    .string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  admin_password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres'),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// ==================== User Management Schemas ====================

export const userRoles = ['admin', 'viewer'] as const;
export type UserRole = (typeof userRoles)[number];

export const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres'),
  role: z.enum(userRoles, {
    errorMap: () => ({ message: 'Selecione um papel válido' }),
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  role: z.enum(userRoles, {
    errorMap: () => ({ message: 'Selecione um papel válido' }),
  }),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
