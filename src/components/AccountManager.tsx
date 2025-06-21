// src/components/AccountManager.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useVerificationAccounts, useAddVerificationAccount, useUpdateVerificationAccount } from '@/hooks/useVerificationAccounts';
import { Skeleton } from './ui/skeleton';

const AccountManager = () => {
  const { data: accounts = [], isLoading } = useVerificationAccounts();
  const addAccountMutation = useAddVerificationAccount();
  const updateAccountMutation = useUpdateVerificationAccount();

  const [newAccountName, setNewAccountName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const addAccount = () => {
    if (newAccountName.trim()) {
      addAccountMutation.mutate({ name: newAccountName.trim() });
      setNewAccountName('');
    }
  };

  const updateAccount = (id: string, field: 'is_done' | 'verification_status' | 'is_deleted', value: any) => {
    updateAccountMutation.mutate({ id, [field]: value });
  };
  
  const getStatusColor = (status: string, field: string) => {
    if (field === 'verified') {
      switch (status) {
        case 'Verified': return 'bg-green-100 text-green-800';
        case 'Not Verified': return 'bg-red-100 text-red-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return status === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };
  
  const filteredAccounts = useMemo(() => accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'pending' && account.verification_status === 'Pending') ||
      (filterStatus === 'done' && account.is_done === true) ||
      (filterStatus === 'deleted' && account.is_deleted === true); // Adicionado filtro para ver apagadas se necessário
    return matchesSearch && matchesFilter;
  }), [accounts, searchTerm, filterStatus]);

  // ***** A CORREÇÃO ESTÁ AQUI *****
  // Agora os cálculos são baseados na lista que está visível na tabela (filteredAccounts)
  const stats = useMemo(() => ({
    total: filteredAccounts.length,
    done: filteredAccounts.filter(a => a.is_done).length,
    verified: filteredAccounts.filter(a => a.verification_status === 'Verified').length,
    pending: filteredAccounts.filter(a => a.verification_status === 'Pending').length,
  }), [filteredAccounts]); // A dependência agora é `filteredAccounts`

  if(isLoading) {
    return <div><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full mt-4" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Account Manager</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{stats.total}</div><div className="text-sm text-gray-600">Total</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{stats.done}</div><div className="text-sm text-gray-600">Done</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{stats.verified}</div><div className="text-sm text-gray-600">Verified</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><div className="text-sm text-gray-600">Pending</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Account Controls</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Input placeholder="New account name..." value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
            <Button onClick={addAccount}><Plus className="w-4 h-4 mr-2" /> Add Account</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account Status</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Done</th>
                  <th className="px-4 py-2 text-left">Verified</th>
                  <th className="px-4 py-2 text-left">Deleted</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="border px-4 py-2">{account.name}</td>
                    <td className="border px-4 py-2">
                      <Select value={account.is_done ? 'Yes' : 'No'} onValueChange={(v) => updateAccount(account.id, 'is_done', v === 'Yes')}>
                        <SelectTrigger className={getStatusColor(account.is_done ? 'Yes' : 'No', 'done')}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                      </Select>
                    </td>
                    <td className="border px-4 py-2">
                      <Select value={account.verification_status} onValueChange={(v) => updateAccount(account.id, 'verification_status', v)}>
                        <SelectTrigger className={getStatusColor(account.verification_status, 'verified')}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Verified">Verified</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Not Verified">Not Verified</SelectItem></SelectContent>
                      </Select>
                    </td>
                    <td className="border px-4 py-2">
                      <Select value={account.is_deleted ? 'Yes' : 'No'} onValueChange={(v) => updateAccount(account.id, 'is_deleted', v === 'Yes')}>
                        <SelectTrigger className={getStatusColor(account.is_deleted ? 'Yes' : 'No', 'deleted')}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountManager;