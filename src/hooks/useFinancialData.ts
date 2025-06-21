// src/hooks/useFinancialData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Define os tipos de dados baseados no teu schema do Supabase para maior segurança
type FinancialTrackerInsert = Database['public']['Tables']['financial_tracker']['Insert'];
export type FinancialRecord = Database['public']['Tables']['financial_tracker']['Row'];
export type UserFinancialSummary = Database['public']['Tables']['user_financial_summary']['Row'];

export const useFinancialRecords = () => {
  return useQuery<FinancialRecord[]>({
    queryKey: ['financial_records'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_tracker').select('*').order('entry_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
};

export const useFinancialSummary = () => {
  return useQuery<UserFinancialSummary | null>({
    queryKey: ['user_financial_summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.from('user_financial_summary').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });
};

export const useUpdateBankroll = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newBankroll: number) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase.from('user_financial_summary').upsert({ user_id: user.id, bankroll: newBankroll }, { onConflict: 'user_id' });
            if(error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user_financial_summary'] });
            toast.success('Bankroll updated!');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
}

/**
 * Hook para criar um novo registo ou ATUALIZAR um existente somando os valores.
 */
export const useUpsertFinancialRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, type, amount }: { date: string, type: 'profit' | 'withdrawal', amount: number }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // 1. Tenta buscar o registo que já existe para este utilizador e este dia.
        const { data: existingRecord } = await supabase
            .from('financial_tracker')
            .select()
            .eq('user_id', user.id)
            .eq('entry_date', date)
            .single();

        // 2. Prepara um novo objeto de registo, começando com os valores existentes (ou zero se não existirem).
        const newRecord: FinancialTrackerInsert = {
            user_id: user.id,
            entry_date: date,
            profit: existingRecord?.profit || 0,
            withdrawal: existingRecord?.withdrawal || 0,
        };

        // ***** AQUI ESTÁ A LÓGICA DE SOMA *****
        // Em vez de substituir, somamos o novo valor (amount) ao valor que já existia no campo correspondente (profit ou withdrawal).
        newRecord[type] = (newRecord[type] || 0) + amount;

        // 3. Envia o registo atualizado para a base de dados. O 'upsert' trata de criar ou atualizar conforme necessário.
        const { data, error } = await supabase
            .from('financial_tracker')
            .upsert(newRecord, { onConflict: 'user_id, entry_date' })
            .select();

        if(error) throw error;
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['financial_records'] });
        toast.success('Financial record saved!');
    },
    onError: (error) => {
        toast.error(error.message);
    }
  });
};

/**
 * Hook para inserir ou atualizar múltiplos registos de uma só vez (em massa) a partir de um CSV.
 */
export const useBatchUpsertFinancialRecords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (records: Omit<FinancialRecord, 'id' | 'user_id'>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const recordsWithUser = records.map(r => ({ ...r, user_id: user.id }));

      const { error } = await supabase
        .from('financial_tracker')
        .upsert(recordsWithUser, { onConflict: 'user_id, entry_date' });
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_records'] });
      toast.success('CSV data imported successfully!');
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });
};