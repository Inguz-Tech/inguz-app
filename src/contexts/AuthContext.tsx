import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'admin' | 'user';
}

interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');
    
    if (storedUser && storedTenant) {
      setUser(JSON.parse(storedUser));
      setTenant(JSON.parse(storedTenant));
    }
    setIsLoading(false);
  }, []);

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    const newTenant: Tenant = {
      id: `tenant_${Date.now()}`,
      name: email.split('@')[0],
      plan: 'free',
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      tenantId: newTenant.id,
      role: 'admin',
    };

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push({ ...newUser, password });
    localStorage.setItem('users', JSON.stringify(users));

    const tenants = JSON.parse(localStorage.getItem('tenants') || '[]');
    tenants.push(newTenant);
    localStorage.setItem('tenants', JSON.stringify(tenants));

    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('tenant', JSON.stringify(newTenant));

    setUser(newUser);
    setTenant(newTenant);

    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (!foundUser) {
      return false;
    }

    const tenants = JSON.parse(localStorage.getItem('tenants') || '[]');
    const foundTenant = tenants.find((t: Tenant) => t.id === foundUser.tenantId);

    const { password: _, ...userWithoutPassword } = foundUser;

    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    localStorage.setItem('tenant', JSON.stringify(foundTenant));

    setUser(userWithoutPassword);
    setTenant(foundTenant);

    return true;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
