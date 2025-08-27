// src/hooks/useFinancialData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { format } from 'date-fns';

// Define os tipos de dados baseados no teu schema do Supabase para maior segurança
type FinancialTrackerInsert = Database['public']['Tables']['financial_tracker']['Insert'];
export type FinancialRecord = Database['public']['Tables']['financial_tracker']['Row'];
export type UserFinancialSummary = Database['public']['Tables']['user_financial_summary']['Row'];

export const useFinancialRecords = () => {
  return useQuery<FinancialRecord[]>({
    queryKey: ['financial_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_tracker')
        .select('*')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useFinancialSummary = () => {
  return useQuery<UserFinancialSummary | null>({
    queryKey: ['user_financial_summary'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_financial_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && (error as any).code !== 'PGRST116') throw error;
      return data;
    },
  });
};

export const useUpdateBankroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newBankroll: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_financial_summary')
        .upsert({ user_id: user.id, bankroll: newBankroll }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_financial_summary'] });
      toast.success('Bankroll updated!');
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });
};

/**
 * Hook para criar um novo registo ou ATUALIZAR um existente somando os valores.
 */
export const useUpsertFinancialRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      type,
      amount,
    }: {
      date: string;
      type: 'profit' | 'withdrawal';
      amount: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Tenta buscar o registo que já existe para este utilizador e este dia.
      const { data: existingRecord, error: existingError } = await supabase
        .from('financial_tracker')
        .select()
        .eq('user_id', user.id)
        .eq('entry_date', date)
        .maybeSingle();

      if (existingError) throw existingError;

      // 2. Prepara um novo objeto de registo, começando com os valores existentes (ou zero se não existirem).
      const newRecord: FinancialTrackerInsert = {
        user_id: user.id,
        entry_date: date,
        profit: existingRecord?.profit || 0,
        withdrawal: existingRecord?.withdrawal || 0,
      };

      // ***** Lógica de soma *****
      newRecord[type] = (newRecord[type] || 0) + amount;

      // 3. Envia o registo atualizado para a base de dados. O 'upsert' cria/atualiza conforme necessário.
      const { data, error } = await supabase
        .from('financial_tracker')
        .upsert(newRecord, { onConflict: 'user_id, entry_date' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Atualiza listas e resumos mensais
      toast.success('Financial record saved!');
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
    onSettled: () => {
      const qc = queryClient;
      qc.invalidateQueries({ queryKey: ['financial_records'] });
      qc.invalidateQueries({ queryKey: ['monthly_financials'] });
    },
  });
};

/**
 * Hook para inserir ou atualizar múltiplos registos de uma só vez (em massa) a partir de um CSV.
 */
export const useBatchUpsertFinancialRecords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (records: Omit<FinancialRecord, 'id' | 'user_id'>[]) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const recordsWithUser = records.map((r) => ({ ...r, user_id: user.id }));

      const { error } = await supabase
        .from('financial_tracker')
        .upsert(recordsWithUser, { onConflict: 'user_id, entry_date' });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('CSV data imported successfully!');
    },
    onError: (error) => {
      toast.error(`Import failed: ${(error as Error).message}`);
    },
    onSettled: () => {
      const qc = queryClient;
      qc.invalidateQueries({ queryKey: ['financial_records'] });
      qc.invalidateQueries({ queryKey: ['monthly_financials'] });
    },
  });
};

/* ===========================
 *       VISÃO MENSAL
 * ===========================
 */

export type MonthlySummary = {
  monthKey: string; // "2025-08"
  totalProfit: number;
  totalWithdrawal: number;
  net: number; // totalProfit - totalWithdrawal
  daily: Array<{
    date: string; // "2025-08-01"
    day: string; // "01", "02", ...
    profit: number;
    withdrawal: number;
    net: number; // profit - withdrawal
  }>;
};

/**
 * Hook para obter os dados agregados por mês (lucro, saídas e saldo),
 * além do detalhe diário do mês selecionado.
 *
 * @param year   Ano numérico (ex.: 2025)
 * @param month0to11  Mês 0-11 (0 = Janeiro, 11 = Dezembro)
 */
export const useMonthlyFinancials = (year: number, month0to11: number) => {
  const from = new Date(year, month0to11, 1);
  const to = new Date(year, month0to11 + 1, 1);

  const fromISO = format(from, 'yyyy-MM-dd');
  const toISO = format(to, 'yyyy-MM-dd');

  const query = useQuery<FinancialRecord[]>({
    queryKey: ['monthly_financials', fromISO],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('financial_tracker')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', fromISO) // >= 1º dia do mês
        .lt('entry_date', toISO) // < 1º dia do mês seguinte
        .order('entry_date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const summary: MonthlySummary | undefined = useMemo(() => {
    const data = query.data;
    if (!data) return undefined;

    // Agrega por data (caso haja +1 registo no mesmo dia)
    const byDate = new Map<string, { profit: number; withdrawal: number }>();
    for (const row of data) {
      const key = row.entry_date; // yyyy-mm-dd
      const cur = byDate.get(key) ?? { profit: 0, withdrawal: 0 };
      cur.profit += Number(row.profit ?? 0);
      cur.withdrawal += Number(row.withdrawal ?? 0);
      byDate.set(key, cur);
    }

    // Gera todos os dias do mês (inclui zeros)
    const days: MonthlySummary['daily'] = [];
    const d = new Date(from);
    while (d < to) {
      const key = format(d, 'yyyy-MM-dd');
      const val = byDate.get(key) ?? { profit: 0, withdrawal: 0 };
      const net = val.profit - val.withdrawal;
      days.push({
        date: key,
        day: format(d, 'dd'),
        profit: val.profit,
        withdrawal: val.withdrawal,
        net,
      });
      d.setDate(d.getDate() + 1);
    }

    const totalProfit = days.reduce((s, x) => s + x.profit, 0);
    const totalWithdrawal = days.reduce((s, x) => s + x.withdrawal, 0);
    const net = totalProfit - totalWithdrawal;

    return {
      monthKey: format(from, 'yyyy-MM'),
      totalProfit,
      totalWithdrawal,
      net,
      daily: days,
    };
  }, [query.data, fromISO, toISO]);

  return {
    summary,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
};
