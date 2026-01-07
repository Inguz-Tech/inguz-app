import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { trackEvent } from '@/lib/analytics';

interface Profile {
  id: string;
  full_name: string;
  tenant_id: string;
}

interface UserRole {
  role: 'master_admin' | 'admin' | 'viewer';
}

interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'premium';
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  role: 'master_admin' | 'admin' | 'viewer' | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<'master_admin' | 'admin' | 'viewer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndTenant = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id')
      .eq('id', userId)
      .single();

    if (profileData) {
      setProfile(profileData);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setRole(roleData.role);
      }

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, plan')
        .eq('id', profileData.tenant_id)
        .single();

      if (tenantData) {
        setTenant(tenantData);
      }
    }
  };

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfileAndTenant(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setTenant(null);
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfileAndTenant(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    trackEvent('logout');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setTenant(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, tenant, role, login, signup, logout, isLoading }}>
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
