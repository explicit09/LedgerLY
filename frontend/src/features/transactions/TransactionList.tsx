import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import Table from '@/components/organisms/Table';
import Input from '@/components/atoms/Input';
import { Transaction, TransactionListResponse } from '@/types/transaction';

interface Filters {
  startDate: string;
  endDate: string;
  category: string;
  search: string;
}

const defaultFilters = (): Filters => ({
  startDate: new Date(new Date().setMonth(new Date().getMonth() - 3))
    .toISOString()
    .split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  category: '',
  search: '',
});

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState<Filters>(defaultFilters());

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get<TransactionListResponse>('/transactions', {
        params: { page: pagination.page, limit: pagination.limit, ...filters },
      });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Amount' },
    { key: 'category', header: 'Category' },
  ];

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        <Input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
        <Input name="category" value={filters.category} onChange={handleFilterChange} placeholder="Category" />
        <Input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search" />
      </div>
      <Table
        columns={columns}
        data={transactions}
        keyExtractor={t => t.id}
        pagination={{ currentPage: pagination.page, totalPages: pagination.pages, onPageChange: p => setPagination(prev => ({ ...prev, page: p })) }}
        emptyMessage="No transactions found"
      />
    </div>
  );
};

export default TransactionList;
