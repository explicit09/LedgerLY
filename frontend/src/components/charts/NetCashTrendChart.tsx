import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface NetCashData {
  date: string;
  net: number;
}

interface NetCashTrendChartProps {
  startDate: string;
  endDate: string;
}

const NetCashTrendChart: React.FC<NetCashTrendChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<NetCashData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await api.get('/analytics/net-cash-trend', {
          params: { startDate, endDate },
        });
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch net cash trend', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [startDate, endDate]);

  if (loading) return <div>Loading chart data...</div>;

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-2">Net Cash Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="net" stroke="#4F46E5" name="Net" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetCashTrendChart;
