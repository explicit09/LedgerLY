import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const location = useLocation();

  const isActiveLink = (path: string) => {
    return location.pathname === path ? 'nav-link-active' : '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary">
                LedgerLY
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className={`nav-link ${isActiveLink('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/transactions" className={`nav-link ${isActiveLink('/transactions')}`}>
                Transactions
              </Link>
              <Link to="/budgets" className={`nav-link ${isActiveLink('/budgets')}`}>
                Budgets
              </Link>
              <Link to="/reports" className={`nav-link ${isActiveLink('/reports')}`}>
                Reports
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/auth/register" className="btn-primary">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-primary text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} LedgerLY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 