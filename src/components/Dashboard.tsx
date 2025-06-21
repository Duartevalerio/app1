// src/components/Dashboard.tsx
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinancialRecords, useFinancialSummary } from '@/hooks/useFinancialData';
import { useVerificationAccounts } from '@/hooks/useVerificationAccounts';
import { Skeleton } from './ui/skeleton';

// --- COMPONENTE: GRÁFICO DE BARRAS DIÁRIO ---
const DailyBarChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawal" name="Withdrawn" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// --- COMPONENTE: GRÁFICO DE PIZZA DE TOTAIS ---
const TotalsPieChart = ({ data }) => {
    const COLORS = ['#22c55e', '#ef4444'];
    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={110} // CORREÇÃO: Raio ligeiramente reduzido para garantir mais espaço
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                <Legend iconType="circle" />
            </PieChart>
        </ResponsiveContainer>
    );
};

const Dashboard = () => {
  const { data: records = [], isLoading: financialsLoading } = useFinancialRecords();
  const { data: verificationAccounts = [], isLoading: verificationsLoading } = useVerificationAccounts();
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary();

  const stats = useMemo(() => {
    const totalProfit = records.reduce((sum, record) => sum + (record.profit || 0), 0);
    const totalWithdrawn = records.reduce((sum, record) => sum + (record.withdrawal || 0), 0);
    const bankroll = financialSummary?.bankroll || 0;
    const totalBalance = bankroll + totalProfit - totalWithdrawn;
    const pendingAccounts = verificationAccounts.filter(acc => acc.verification_status === 'Pending' && !acc.is_deleted).length;
    return { totalBalance, totalProfit, totalWithdrawn, pendingAccounts };
  }, [records, verificationAccounts, financialSummary]);

  const dailyChartData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const recordsThisMonth = records.filter(r => new Date(r.entry_date).getUTCFullYear() === year && new Date(r.entry_date).getUTCMonth() === month);
    return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayRecord = recordsThisMonth.find(r => new Date(r.entry_date).getUTCDate() === day);
        return {
            day: day.toString(),
            profit: dayRecord?.profit || 0,
            withdrawal: dayRecord?.withdrawal || 0,
        };
    });
  }, [records]);

  const pieChartData = useMemo(() => [
    { name: 'Total Profit', value: stats.totalProfit },
    { name: 'Total Withdrawn', value: stats.totalWithdrawn },
  ].filter(item => item.value > 0), [stats.totalProfit, stats.totalWithdrawn]);

  const isLoading = financialsLoading || verificationsLoading || summaryLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('pt-PT')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">€{stats.totalBalance.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Profit</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">€{stats.totalProfit.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">€{stats.totalWithdrawn.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Pending Accounts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pendingAccounts}</div></CardContent></Card>
      </div>
      
      {/* CORREÇÃO: O layout foi alterado para lg:grid-cols-2 para dividir o espaço igualmente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader><CardTitle>Daily Performance (Current Month)</CardTitle></CardHeader>
            <CardContent><DailyBarChart data={dailyChartData} /></CardContent>
          </Card>
        </div>
        <div>
            <Card>
                <CardHeader><CardTitle>Profit vs. Withdrawn</CardTitle></CardHeader>
                <CardContent><TotalsPieChart data={pieChartData} /></CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div><Skeleton className="h-[422px] rounded-lg" /></div>
        <div><Skeleton className="h-[422px] rounded-lg" /></div>
      </div>
    </div>
);

export default Dashboard;