import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-2">Net Worth Trend</h3>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            Chart Placeholder
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-2">Monthly Spending</h3>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            Chart Placeholder
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-2">Recent Transactions</h3>
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 rounded">Transaction 1</div>
            <div className="p-2 bg-gray-50 rounded">Transaction 2</div>
            <div className="p-2 bg-gray-50 rounded">Transaction 3</div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-2">Recurring Payments</h3>
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 rounded">Payment 1</div>
            <div className="p-2 bg-gray-50 rounded">Payment 2</div>
            <div className="p-2 bg-gray-50 rounded">Payment 3</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 