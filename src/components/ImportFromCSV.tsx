// src/components/ImportFromCSV.tsx
import React, { useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBatchUpsertFinancialRecords } from '@/hooks/useFinancialData';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';

export const ImportFromCSV = () => {
  const batchUpsertMutation = useBatchUpsertFinancialRecords();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
            toast.error(`Error parsing CSV: ${results.errors[0].message}`);
            return;
        }

        // CORREÇÃO: Alterado para aceitar cabeçalhos em português
        const parsedData = results.data as Array<{ Data: string; Ganho: string; Levantamento: string }>;
        
        const recordsToInsert = parsedData.map(row => {
          // CORREÇÃO: Usar os nomes das colunas em português para ler os dados
          const dateStr = row.Data;
          const profitStr = row.Ganho;
          const withdrawalStr = row.Levantamento;

          if (!dateStr) {
              return null; // Ignora linhas sem data
          }

          const date = parse(dateStr, 'dd/MM/yyyy', new Date());
          const profit = parseFloat(profitStr?.replace(',', '.') || '0');
          const withdrawal = parseFloat(withdrawalStr?.replace(',', '.') || '0');

          if (isNaN(date.getTime())) {
            toast.warning(`Skipping row with invalid date: ${dateStr}`);
            return null;
          }

          return {
            entry_date: format(date, 'yyyy-MM-dd'),
            profit: isNaN(profit) ? 0 : profit,
            withdrawal: isNaN(withdrawal) ? 0 : withdrawal,
          };
        }).filter((record): record is NonNullable<typeof record> => record !== null);

        if (recordsToInsert.length > 0) {
          batchUpsertMutation.mutate(recordsToInsert as any);
        } else {
          toast.error("No valid data found in the CSV file.");
        }
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      }
    });

    if(event.target) {
        event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file to add multiple records at once. The file must have columns: <strong>Data, Ganho, Levantamento</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button onClick={handleButtonClick} disabled={batchUpsertMutation.isPending}>
          {batchUpsertMutation.isPending ? 'Importing...' : 'Upload CSV File'}
        </Button>
      </CardContent>
    </Card>
  );
};