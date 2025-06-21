
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BettingAccount, BettingOperation } from '@/hooks/useBettingAccounts';

interface OperationsTableProps {
  selectedAccount: BettingAccount;
  operations: BettingOperation[];
  isLoading: boolean;
}

export const OperationsTable = ({ selectedAccount, operations, isLoading }: OperationsTableProps) => {
  const calculateSpent = (operation: BettingOperation, fixedStake: number) => {
    return operation.bet_type === 'Standard Bet' 
      ? fixedStake + operation.orbit_value 
      : operation.orbit_value;
  };

  const calculateProfit = (operation: BettingOperation, fixedStake: number) => {
    const spent = calculateSpent(operation, fixedStake);
    return operation.gain_value - spent;
  };

  const totalProfit = operations.reduce((sum, op) => 
    sum + calculateProfit(op, selectedAccount.fixed_stake_value), 0
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading operations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operations History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">BWIN (Fixed Stake)</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Orbit</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Gain</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Spent</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Profit</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation, index) => {
                const spent = calculateSpent(operation, selectedAccount.fixed_stake_value);
                const profit = calculateProfit(operation, selectedAccount.fixed_stake_value);
                
                return (
                  <tr key={operation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-2">
                      {operation.bet_type === 'Standard Bet' ? `€${selectedAccount.fixed_stake_value.toFixed(2)}` : '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">€{operation.orbit_value.toFixed(2)}</td>
                    <td className="border border-gray-200 px-4 py-2">€{operation.gain_value.toFixed(2)}</td>
                    <td className="border border-gray-200 px-4 py-2 font-semibold">€{spent.toFixed(2)}</td>
                    <td className={`border border-gray-200 px-4 py-2 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{profit.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">{operation.bet_type}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50">
                <td colSpan={4} className="border border-gray-200 px-4 py-2 font-bold text-right">Total Profit:</td>
                <td className={`border border-gray-200 px-4 py-2 font-bold text-xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{totalProfit.toFixed(2)}
                </td>
                <td className="border border-gray-200 px-4 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
