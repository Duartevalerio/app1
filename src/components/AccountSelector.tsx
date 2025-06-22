// src/components/AccountSelector.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { BettingAccount } from '@/hooks/useBettingAccounts';
import { NewAccountForm } from './NewAccountForm';

interface AccountSelectorProps {
  accounts: BettingAccount[];
  selectedAccountId: string;
  onAccountSelect: (accountId: string) => void;
  showNewAccountForm: boolean;
  onToggleNewAccountForm: () => void;
}

export const AccountSelector = ({ accounts, selectedAccountId, onAccountSelect, showNewAccountForm, onToggleNewAccountForm }: AccountSelectorProps) => {
  return (
    <Card>
      <CardHeader><CardTitle>Select Account</CardTitle></CardHeader>
      <CardContent>
        {/* CORREÇÃO: O layout agora é flex-col em mobile e flex-row em ecrãs maiores */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label htmlFor="account-select">Choose Account</Label>
            <Select value={selectedAccountId} onValueChange={onAccountSelect}>
              <SelectTrigger><SelectValue placeholder="Select an account..." /></SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (€{account.fixed_stake_value.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onToggleNewAccountForm} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        </div>

        {showNewAccountForm && <NewAccountForm />}
      </CardContent>
    </Card>
  );
};