// src/components/Dashboard.tsx
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMonthlyFinancials, useFinancialRecords } from '@/hooks/useFinancialData';
import MonthPicker from '@/components/MonthPicker';

// --- CORES (pedido do utilizador) ---
const GREEN = '#22c55e';
const RED = '#ef4444';
const GRAY_AXIS = '#888888';

// --- Helpers ---
const moeda = (v: number) =>
  v.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  });

// --- COMPONENTE: GRÁFICO DE BARRAS DIÁRIO (Lucro vs Saídas) ---
const DailyBarChart = ({
  data,
}: {
  data: Array<{ day: string; profit: number; withdrawal: number }>;
}) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" stroke={GRAY_AXIS} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke={GRAY_AXIS}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip
          formatter={(value: any) => moeda(Number(value))}
          labelFormatter={(label) => `Dia ${label}`}
          cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
        />
        <Legend iconType="circle" />
        <Bar dataKey="profit" name="Lucro" fill={GREEN} radius={[4, 4, 0, 0]} />
        <Bar dataKey="withdrawal" name="Saídas" fill={RED} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// --- COMPONENTE: GRÁFICO DE PIZZA DE TOTAIS (Mês) ---
const TotalsPieChart = ({ data }: { data: Array<{ name: string; value: number }> }) => {
  const COLORS = [GREEN, RED];
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={110}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => moeda(Number(value))} />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  // Seleção do mês/ano para visão mensal
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());

  const { summary, isLoading } = useMonthlyFinancials(year, month0);

  // Totais globais (todos os registos) — para os 3 cards por baixo dos gráficos
  const { data: allRecords = [], isLoading: loadingAll } = useFinancialRecords();

  const globalTotals = useMemo(() => {
    const totalProfitAll = allRecords.reduce((s, r) => s + Number(r.profit ?? 0), 0);
    const totalWithdrawalAll = allRecords.reduce((s, r) => s + Number(r.withdrawal ?? 0), 0);
    const netAll = totalProfitAll - totalWithdrawalAll + 650;
    return { totalProfitAll, totalWithdrawalAll, netAll };
  }, [allRecords]);

  const pieChartData = useMemo(
    () =>
      summary
        ? [
            { name: 'Lucro', value: summary.totalProfit },
            { name: 'Saídas', value: summary.totalWithdrawal },
          ].filter((i) => i.value > 0)
        : [],
    [summary]
  );

  const statusPositivo = (summary?.net ?? 0) >= 0;

  if (isLoading || !summary || loadingAll) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho + Seletor de mês/ano */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard — Visão Mensal</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-PT')}
          </div>
          <MonthPicker
            year={year}
            month0to11={month0}
            onChange={(y, m0) => {
              setYear(y);
              setMonth0(m0);
            }}
          />
        </div>
      </div>

      {/* Cards de resumo do mês */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro (mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[color:var(--green-600,#16a34a)]">
              {moeda(summary.totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saídas (mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[color:var(--red-600,#dc2626)]">
              {moeda(summary.totalWithdrawal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo (mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moeda(summary.net)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xl font-semibold">
            {statusPositivo ? (
              <>
                <ArrowUpRight className="h-5 w-5 text-emerald-500" /> Positivo
              </>
            ) : (
              <>
                <ArrowDownRight className="h-5 w-5 text-red-500" /> Negativo
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lucro vs Saídas — por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyBarChart
              data={summary.daily.map((d) => ({
                day: d.day,
                profit: d.profit,
                withdrawal: d.withdrawal,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <TotalsPieChart data={pieChartData} />
          </CardContent>
        </Card>
      </div>

      {/* --- NOVO BLOCO: Totais Globais (todos os registos) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: GREEN }}>
              {moeda(globalTotals.totalProfitAll)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: RED }}>
              {moeda(globalTotals.totalWithdrawalAll)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diferença Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: globalTotals.netAll >= 0 ? GREEN : RED }}
            >
              {moeda(globalTotals.netAll)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-9 w-72 rounded-md" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-9 w-80 rounded-md" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Skeleton className="h-[422px] rounded-lg" />
      </div>
      <div>
        <Skeleton className="h-[422px] rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  </div>
);

export default Dashboard;
