import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signupSchema,
  tenantSchema,
  createUserSchema,
  updateUserSchema,
} from '../validations';

describe('loginSchema', () => {
  it('should validate a correct login', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email é obrigatório');
    }
  });

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email inválido');
    }
  });

  it('should reject email exceeding max length', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = loginSchema.safeParse({
      email: longEmail,
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Senha deve ter no mínimo 6 caracteres');
    }
  });

  it('should reject password exceeding max length', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it('should trim email whitespace', () => {
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('signupSchema', () => {
  const validSignup = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('should validate a correct signup', () => {
    const result = signupSchema.safeParse(validSignup);
    expect(result.success).toBe(true);
  });

  it('should reject name shorter than 2 characters', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      name: 'J',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nome deve ter no mínimo 2 caracteres');
    }
  });

  it('should reject name exceeding max length', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('should reject mismatched passwords', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      confirmPassword: 'differentpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('As senhas não coincidem');
    }
  });

  it('should trim name and email', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      name: '  John Doe  ',
      email: '  john@example.com  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
    }
  });
});

describe('tenantSchema', () => {
  const validTenant = {
    tenant_name: 'My Company',
    admin_name: 'Admin User',
    admin_email: 'admin@company.com',
    admin_password: 'securepass123',
  };

  it('should validate a correct tenant', () => {
    const result = tenantSchema.safeParse(validTenant);
    expect(result.success).toBe(true);
  });

  it('should reject tenant_name shorter than 2 characters', () => {
    const result = tenantSchema.safeParse({
      ...validTenant,
      tenant_name: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nome do tenant deve ter no mínimo 2 caracteres');
    }
  });

  it('should reject admin_name shorter than 2 characters', () => {
    const result = tenantSchema.safeParse({
      ...validTenant,
      admin_name: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nome do admin deve ter no mínimo 2 caracteres');
    }
  });

  it('should reject invalid admin_email', () => {
    const result = tenantSchema.safeParse({
      ...validTenant,
      admin_email: 'invalid-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email inválido');
    }
  });

  it('should reject admin_password shorter than 6 characters', () => {
    const result = tenantSchema.safeParse({
      ...validTenant,
      admin_password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should trim all string fields', () => {
    const result = tenantSchema.safeParse({
      tenant_name: '  My Company  ',
      admin_name: '  Admin User  ',
      admin_email: '  admin@company.com  ',
      admin_password: 'securepass123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tenant_name).toBe('My Company');
      expect(result.data.admin_name).toBe('Admin User');
      expect(result.data.admin_email).toBe('admin@company.com');
    }
  });
});

describe('createUserSchema', () => {
  const validUser = {
    full_name: 'New User',
    email: 'newuser@example.com',
    password: 'password123',
    role: 'viewer' as const,
  };

  it('should validate a correct user creation', () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should accept admin role', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid role', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Selecione um papel válido');
    }
  });

  it('should reject full_name shorter than 2 characters', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      full_name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 characters', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('should validate a correct user update', () => {
    const result = updateUserSchema.safeParse({
      full_name: 'Updated Name',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('should reject full_name shorter than 2 characters', () => {
    const result = updateUserSchema.safeParse({
      full_name: 'A',
      role: 'viewer',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const result = updateUserSchema.safeParse({
      full_name: 'Valid Name',
      role: 'manager',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Selecione um papel válido');
    }
  });

  it('should trim full_name', () => {
    const result = updateUserSchema.safeParse({
      full_name: '  Updated Name  ',
      role: 'viewer',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe('Updated Name');
    }
  });
});
