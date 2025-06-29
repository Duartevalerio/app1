// src/hooks/useVerificationAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Tipo de dados que corresponde exatamente à estrutura da sua tabela
export type VerificationAccount = {
  id: string;
  created_at: string;
  name: string;
  user_id: string;
  verification_status: 'Verified' | 'Pending' | 'Not Verified';
  is_deleted: boolean;
  done_status: 'No' | 'Yes (Ganha)' | 'Yes (Perda)';
};

export const useVerificationAccounts = () => {
  return useQuery<VerificationAccount[]>({
    queryKey: ['verification_accounts'],
    queryFn: async () => {
      // O select busca todas as colunas, incluindo a nova 'done_status'
      const { data, error } = await supabase.from('verification_accounts').select('*').order('created_at');
      if (error) throw error;
      // Usamos 'as any' para contornar possíveis desatualizações do tipo automático do Supabase
      return data as any; 
    }
  });
};

export const useAddVerificationAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (account: { name: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");
            
            const { data, error } = await supabase.from('verification_accounts').insert({ ...account, user_id: user.id }).select();
            if(error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verification_accounts'] });
            toast.success("Account added!");
        }
    });
};

export const useUpdateVerificationAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (account: Partial<VerificationAccount> & { id: string }) => {
            const { error } = await supabase.from('verification_accounts').update(account).eq('id', account.id);
            if(error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verification_accounts'] });
            toast.success("Account updated!");
        }
    });
};