import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

type Props = {
  year: number;
  month0to11: number;
  onChange: (y: number, m0: number) => void;
  yearSpan?: { start: number; end: number }; // ex.: {start: 2023, end: 2026}
};

export default function MonthPicker({ year, month0to11, onChange, yearSpan }: Props) {
  const now = new Date();
  const span = yearSpan ?? { start: now.getFullYear() - 2, end: now.getFullYear() + 1 };
  const years = Array.from({ length: span.end - span.start + 1 }, (_, i) => span.start + i);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <Select value={String(month0to11)} onValueChange={(v) => onChange(year, Number(v))}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MESES.map((nome, idx) => (
            <SelectItem key={idx} value={String(idx)}>{nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(v) => onChange(Number(v), month0to11)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
