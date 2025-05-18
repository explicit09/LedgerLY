import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface ExpenseData {
  category: string;
  amount: number;
}

interface ExpenseBreakdownChartProps {
  startDate: string;
  endDate: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA46BE'];

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenseData() {
      setLoading(true);
      try {
        const response = await api.get('/analytics/expense-breakdown', {
          params: { startDate, endDate },
        });
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch expense data', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenseData();
  }, [startDate, endDate]);

  if (loading) return <div>Loading chart data...</div>;

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-2">Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" outerRadius={100}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseBreakdownChart;
