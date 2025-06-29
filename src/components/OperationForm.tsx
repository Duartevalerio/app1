// src/components/OperationForm.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateBettingOperation, BettingAccount } from '@/hooks/useBettingAccounts';

interface OperationFormProps {
  selectedAccount: BettingAccount;
}

export const OperationForm = ({ selectedAccount }: OperationFormProps) => {
  const [orbitValue, setOrbitValue] = useState('');
  const [gainValue, setGainValue] = useState('');
  const [betType, setBetType] = useState<'Standard Bet' | 'Freebet'>('Standard Bet');
  const createOperation = useCreateBettingOperation();

  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orbitValue || !gainValue) return;
    
    await createOperation.mutateAsync({
      account_id: selectedAccount.id,
      orbit_value: parseFloat(orbitValue),
      gain_value: parseFloat(gainValue),
      bet_type: betType
    });
    
    setOrbitValue('');
    setGainValue('');
    setBetType('Standard Bet');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Operation - {selectedAccount.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddOperation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orbit">Orbit Value (€)</Label>
              <Input id="orbit" type="number" step="0.01" value={orbitValue} onChange={(e) => setOrbitValue(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="gain">Gain Value (€)</Label>
              <Input id="gain" type="number" step="0.01" value={gainValue} onChange={(e) => setGainValue(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="bet-type">Bet Type</Label>
            <Select value={betType} onValueChange={(value: 'Standard Bet' | 'Freebet') => setBetType(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Standard Bet">Standard Bet</SelectItem><SelectItem value="Freebet">Freebet</SelectItem></SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={createOperation.isPending}>
            {createOperation.isPending ? 'Adding...' : 'Add Operation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};