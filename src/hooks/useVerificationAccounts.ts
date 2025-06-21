// src/hooks/useVerificationAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type VerificationAccount = Database['public']['Tables']['verification_accounts']['Row'];

/**
 * Hook para buscar todas as contas de verificação.
 */
export const useVerificationAccounts = () => {
  return useQuery<VerificationAccount[]>({
    queryKey: ['verification_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('verification_accounts').select('*').order('created_at');
      if (error) throw error;
      return data;
    }
  });
};

/**
 * Hook para adicionar uma nova conta de verificação.
 */
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
            toast.success("Account added successfully!");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
};

/**
 * Hook para atualizar uma conta de verificação.
 */
export const useUpdateVerificationAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (account: Partial<VerificationAccount> & { id: string }) => {
            const { error } = await supabase.from('verification_accounts').update(account).eq('id', account.id);
            if(error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verification_accounts'] });
            toast.success("Account status updated!");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
};