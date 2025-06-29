// src/components/OperationsTable.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BettingAccount, BettingOperation, useUpdateOperationToLost } from '@/hooks/useBettingAccounts';
import { Button } from './ui/button';

interface OperationsTableProps {
  selectedAccount: BettingAccount;
  operations: BettingOperation[];
  isLoading: boolean;
}

export const OperationsTable = ({ selectedAccount, operations, isLoading }: OperationsTableProps) => {
  const updateOperationMutation = useUpdateOperationToLost();

  const calculateSpent = (operation: BettingOperation, fixedStake: number) => {
    return operation.bet_type === 'Standard Bet' 
      ? fixedStake + operation.orbit_value 
      : operation.orbit_value;
  };

  const calculateProfit = (operation: BettingOperation, fixedStake: number) => {
    const spent = calculateSpent(operation, fixedStake);
    return operation.gain_value - spent;
  };

  const handleLostBet = (operation: BettingOperation) => {
    const spentValue = calculateSpent(operation, selectedAccount.fixed_stake_value);
    
    updateOperationMutation.mutate({
      operationId: operation.id,
      accountId: operation.account_id,
      newGainValue: spentValue
    });
  };

  const totalProfit = operations.reduce((sum, op) => sum + calculateProfit(op, selectedAccount.fixed_stake_value), 0);

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading operations...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Operations History</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">BWIN (Fixed Stake)</th>
                <th className="px-4 py-2 text-left">Orbit</th>
                <th className="px-4 py-2 text-left">Gain</th>
                <th className="px-4 py-2 text-left">Spent</th>
                <th className="px-4 py-2 text-left">Profit</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => {
                const profit = calculateProfit(operation, selectedAccount.fixed_stake_value);
                
                return (
                  <tr key={operation.id}>
                    <td className="border px-4 py-2">{operation.bet_type === 'Standard Bet' ? `€${selectedAccount.fixed_stake_value.toFixed(2)}` : '-'}</td>
                    <td className="border px-4 py-2">€{operation.orbit_value.toFixed(2)}</td>
                    <td className="border px-4 py-2">€{operation.gain_value.toFixed(2)}</td>
                    <td className="border px-4 py-2 font-semibold">€{calculateSpent(operation, selectedAccount.fixed_stake_value).toFixed(2)}</td>
                    <td className={`border px-4 py-2 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>€{profit.toFixed(2)}</td>
                    <td className="border px-4 py-2 text-sm">{operation.bet_type}</td>
                    <td className="border px-4 py-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleLostBet(operation)}
                        disabled={updateOperationMutation.isPending}
                      >
                        Perdi
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50">
                <td colSpan={6} className="px-4 py-2 font-bold text-right">Total Profit:</td>
                <td className={`px-4 py-2 font-bold text-xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>€{totalProfit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};