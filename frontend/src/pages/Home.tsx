import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-primary mb-4">Welcome to LedgerLY</h1>
      <p className="text-xl text-gray-600 mb-8">Your personal finance dashboard</p>
      <div className="space-x-4">
        <Link to="/auth/register" className="btn-primary">
          Get Started
        </Link>
        <Link to="/auth/login" className="btn-secondary">
          Sign In
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-primary mb-2">Track Expenses</h3>
          <p className="text-gray-600">Monitor your spending habits and categorize transactions automatically.</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-primary mb-2">Set Budgets</h3>
          <p className="text-gray-600">Create custom budgets and get alerts when you're close to your limits.</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-primary mb-2">Analyze Trends</h3>
          <p className="text-gray-600">Visualize your financial data with beautiful charts and reports.</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 