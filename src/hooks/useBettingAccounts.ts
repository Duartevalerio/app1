
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BettingAccount {
  id: string;
  name: string;
  fixed_stake_value: number;
  created_at: string;
}

export interface BettingOperation {
  id: string;
  account_id: string;
  orbit_value: number;
  gain_value: number;
  bet_type: 'Standard Bet' | 'Freebet';
  created_at: string;
}

export const useBettingAccounts = () => {
  return useQuery({
    queryKey: ['betting-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('betting_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BettingAccount[];
    }
  });
};

export const useBettingOperations = (accountId: string) => {
  return useQuery({
    queryKey: ['betting-operations', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('betting_operations')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BettingOperation[];
    },
    enabled: !!accountId
  });
};

export const useCreateBettingAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, fixed_stake_value }: { name: string; fixed_stake_value: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('betting_accounts')
        .insert({ 
          name, 
          fixed_stake_value,
          user_id: user.id 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betting-accounts'] });
      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const useCreateBettingOperation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (operation: Omit<BettingOperation, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('betting_operations')
        .insert(operation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['betting-operations', variables.account_id] });
      toast.success('Operation added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};
