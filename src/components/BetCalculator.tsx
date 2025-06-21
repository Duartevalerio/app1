
import React, { useState } from 'react';
import { useBettingAccounts, useBettingOperations } from '@/hooks/useBettingAccounts';
import { AccountSelector } from './AccountSelector';
import { OperationForm } from './OperationForm';
import { OperationsTable } from './OperationsTable';

const BetCalculator = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);

  const { data: accounts = [], isLoading: accountsLoading } = useBettingAccounts();
  const { data: operations = [], isLoading: operationsLoading } = useBettingOperations(selectedAccountId);

  const selectedAccount = accounts.find(account => account.id === selectedAccountId);

  if (accountsLoading) {
    return <div className="p-6">Loading accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bet Calculator</h1>
      </div>

      <AccountSelector
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountSelect={setSelectedAccountId}
        showNewAccountForm={showNewAccountForm}
        onToggleNewAccountForm={() => setShowNewAccountForm(!showNewAccountForm)}
      />

      {selectedAccount && (
        <>
          <OperationForm selectedAccount={selectedAccount} />
          <OperationsTable 
            selectedAccount={selectedAccount}
            operations={operations}
            isLoading={operationsLoading}
          />
        </>
      )}
    </div>
  );
};

export default BetCalculator;
