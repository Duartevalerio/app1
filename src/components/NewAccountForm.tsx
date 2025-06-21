
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBettingAccount } from '@/hooks/useBettingAccounts';

export const NewAccountForm = () => {
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountStake, setNewAccountStake] = useState('');
  const createAccount = useCreateBettingAccount();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName || !newAccountStake) return;
    
    await createAccount.mutateAsync({
      name: newAccountName,
      fixed_stake_value: parseFloat(newAccountStake)
    });
    
    setNewAccountName('');
    setNewAccountStake('');
  };

  return (
    <form onSubmit={handleCreateAccount} className="mt-4 p-4 border rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="account-name">Account Name</Label>
          <Input
            id="account-name"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="fixed-stake">Fixed Stake Value (€)</Label>
          <Input
            id="fixed-stake"
            type="number"
            step="0.01"
            value={newAccountStake}
            onChange={(e) => setNewAccountStake(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={createAccount.isPending}>
          {createAccount.isPending ? 'Creating...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};
