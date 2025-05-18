import React, { useEffect, useState } from 'react';
import Table, { Column } from '../organisms/Table';
import api from '@/lib/api';

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDate: string;
}

interface RecurringTransactionsListProps {
  startDate: string;
  endDate: string;
}

const columns: Column<RecurringTransaction>[] = [
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount', render: v => `$${v.toFixed(2)}` },
  { key: 'frequency', header: 'Frequency' },
  { key: 'nextDate', header: 'Next Date' },
];

const RecurringTransactionsList: React.FC<RecurringTransactionsListProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await api.get('/analytics/recurring-transactions', {
          params: { startDate, endDate },
        });
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch recurring transactions', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [startDate, endDate]);

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Recurring Transactions</h3>
      <Table columns={columns} data={data} keyExtractor={t => t.id} />
    </div>
  );
};

export default RecurringTransactionsList;
