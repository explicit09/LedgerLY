import React, { useState } from 'react';
import {
  CashFlowChart,
  ExpenseBreakdownChart,
  DateRangeSelector,
  NetCashTrendChart,
  RecurringTransactionsList,
} from '../components/charts';
import { subMonths, formatISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = subMonths(end, 1);
    return {
      startDate: formatISO(start, { representation: 'date' }),
      endDate: formatISO(end, { representation: 'date' }),
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      <DateRangeSelector
        startDate={range.startDate}
        endDate={range.endDate}
        onChange={setRange}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <NetCashTrendChart startDate={range.startDate} endDate={range.endDate} />
        </div>
        <div className="card">
          <CashFlowChart startDate={range.startDate} endDate={range.endDate} />
        </div>
        <div className="card">
          <ExpenseBreakdownChart startDate={range.startDate} endDate={range.endDate} />
        </div>
        <div className="card">
          <RecurringTransactionsList startDate={range.startDate} endDate={range.endDate} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 