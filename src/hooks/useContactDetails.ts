import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ContactDetails {
  id: string;
  name: string;
  phone: string;
  status: string;
  tags: string[];
  variables: Record<string, any>;
}

export const useContactDetails = (contactId: string) => {
  return useQuery({
    queryKey: ['contact-details', contactId],
    queryFn: async (): Promise<ContactDetails | null> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, status, tags, variables')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error fetching contact details:', error);
        return null;
      }

      return data;
    },
    enabled: !!contactId,
  });
};
