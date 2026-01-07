import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ContactDetails {
  id: string;
  name: string;
  phone: string;
  status: string;
  tags: string[];
  variables: Record<string, any>;
}

export const useContactDetails = (contactId: string) => {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ['contact-details', contactId, tenantId],
    queryFn: async (): Promise<ContactDetails | null> => {
      if (!tenantId) {
        return null;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, status, tags, variables, tenant_id')
        .eq('id', contactId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao buscar contato: ${error.message}`);
      }

      return data;
    },
    enabled: !!contactId && !!tenantId,
  });
};
