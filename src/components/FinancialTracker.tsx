// src/components/FinancialTracker.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useFinancialRecords, useFinancialSummary, useUpsertFinancialRecord, useUpdateBankroll } from '@/hooks/useFinancialData';
import { Skeleton } from './ui/skeleton';
import { ImportFromCSV } from './ImportFromCSV'; // <-- 1. IMPORTAR O NOVO COMPONENTE

const FinancialTracker = () => {
  const { data: records = [], isLoading: recordsLoading } = useFinancialRecords();
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const upsertRecordMutation = useUpsertFinancialRecord();
  const updateBankrollMutation = useUpdateBankroll();

  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
  const [entryType, setEntryType] = useState<'profit' | 'withdrawal'>('profit');
  const [entryAmount, setEntryAmount] = useState('');

  const [bankrollInput, setBankrollInput] = useState(summary?.bankroll || 0);
  useEffect(() => {
    if (summary) {
        setBankrollInput(summary.bankroll || 0);
    }
  }, [summary]);

  const handleBankrollBlur = () => {
    if (bankrollInput !== summary?.bankroll) {
        updateBankrollMutation.mutate(bankrollInput);
    }
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(entryAmount);
    if (!entryDate || !entryAmount || isNaN(amount)) {
        toast.error("Please fill all fields with valid values.");
        return;
    }
    
    upsertRecordMutation.mutate({
        date: format(entryDate, 'yyyy-MM-dd'),
        type: entryType,
        amount: amount,
    });
    
    setEntryAmount('');
  };

  const totalProfit = useMemo(() => records.reduce((sum, r) => sum + (r.profit || 0), 0), [records]);
  const totalWithdrawn = useMemo(() => records.reduce((sum, r) => sum + (r.withdrawal || 0), 0), [records]);
  const balance = (summary?.bankroll || 0) + totalProfit - totalWithdrawn;

  if (recordsLoading || summaryLoading) {
    return <div><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full mt-4" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Financial Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Bankroll</CardTitle></CardHeader>
            <CardContent><Input type="number" step="0.01" value={bankrollInput} onChange={e => setBankrollInput(parseFloat(e.target.value) || 0)} onBlur={handleBankrollBlur} className="text-xl font-bold" /></CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">€{totalWithdrawn.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Profit</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">€{totalProfit.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Balance</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>€{balance.toFixed(2)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Add New Record</CardTitle></CardHeader>
        <CardContent>
            <form onSubmit={handleSubmitEntry} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={entryDate} onSelect={setEntryDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={entryType} onValueChange={(v: 'profit' | 'withdrawal') => setEntryType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="profit">Profit</SelectItem><SelectItem value="withdrawal">Withdrawal</SelectItem></SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="amount">Amount (€)</Label>
                    <Input id="amount" type="number" step="0.01" placeholder="e.g., 25.50" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} required />
                </div>
                <Button type="submit" disabled={upsertRecordMutation.isPending}>
                  {upsertRecordMutation.isPending ? 'Saving...' : 'Add Record'}
                </Button>
            </form>
        </CardContent>
      </Card>

      {/* 2. ADICIONAR O COMPONENTE DE IMPORTAÇÃO AQUI */}
      <ImportFromCSV />

      <Card>
          <CardHeader><CardTitle>Records History</CardTitle></CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead>
                          <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Date</th>
                              <th className="px-4 py-2 text-left">Profit</th>
                              <th className="px-4 py-2 text-left">Withdrawal</th>
                          </tr>
                      </thead>
                      <tbody>
                          {records.map((record) => (
                              <tr key={record.id}>
                                  <td className="border px-4 py-2 font-medium">{format(new Date(record.entry_date), 'dd/MM/yyyy')}</td>
                                  <td className="border px-4 py-2 text-green-600">{record.profit ? `€${record.profit.toFixed(2)}` : '-'}</td>
                                  <td className="border px-4 py-2 text-red-600">{record.withdrawal ? `€${record.withdrawal.toFixed(2)}` : '-'}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </CardContent>
      </Card>
    </div>
  );
};

export default FinancialTracker;