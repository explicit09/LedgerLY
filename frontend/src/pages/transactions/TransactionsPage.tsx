import React from 'react';
import { TransactionList } from '@/features/transactions';

const TransactionsPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Transactions</h1>
      <TransactionList />
    </div>
  );
};

export default TransactionsPage;
