import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';

// Context
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/auth/AuthLayout';

// Pages
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import SettingsPage from '../pages/account/SettingsPage';
import TransactionsPage from '../pages/transactions/TransactionsPage';
import BankConnectionsPage from '../pages/account/BankConnectionsPage';


// Error page
const ErrorPage: React.FC = () => (
  <div className="error-page">
    <h1>Oops!</h1>
    <p>Sorry, an unexpected error has occurred.</p>
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return user ? <>{element}</> : <Navigate to="/auth/login" replace />;
};

// Public route component (for auth pages when user is already logged in)
const PublicRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <>{element}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute element={<Dashboard />} />,
      },
      {
        path: 'transactions',
        element: <ProtectedRoute element={<TransactionsPage />} />,
      },
      {
        path: 'settings',
        element: <ProtectedRoute element={<SettingsPage />} />,
      },
      {
        path: 'bank-connections',
        element: <ProtectedRoute element={<BankConnectionsPage />} />,
      },
    ],
  },
  {
    path: '/auth',
    element: (
      <AuthLayout 
        title="Welcome to LedgerLY"
        subtitle="Sign in to your account"
        footerText="Don't have an account?"
        footerLink={{
          to: '/auth/register',
          text: 'Sign up'
        }}
      >
        <Outlet />
      </AuthLayout>
    ),
    children: [
      {
        path: 'login',
        element: <PublicRoute element={<LoginPage />} />,
      },
      {
        path: 'register',
        element: <PublicRoute element={<RegisterPage />} />,
      },
      {
        path: 'forgot-password',
        element: <PublicRoute element={<ForgotPasswordPage />} />,
      },
      {
        path: 'reset-password',
        element: <PublicRoute element={<ResetPasswordPage />} />,
      },
    ],
  },
]);

// We need to wrap the router with AuthProvider to use useAuth in ProtectedRoute
const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default AppRouter;