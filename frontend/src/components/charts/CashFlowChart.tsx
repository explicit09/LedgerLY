import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

interface CashFlowChartProps {
  startDate: string;
  endDate: string;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCashFlowData() {
      setLoading(true);
      try {
        const response = await api.get('/analytics/cash-flow', {
          params: { startDate, endDate },
        });
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch cash flow data', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlowData();
  }, [startDate, endDate]);

  if (loading) return <div>Loading chart data...</div>;

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-2">Monthly Cash Flow</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#4CAF50" name="Income" />
          <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
