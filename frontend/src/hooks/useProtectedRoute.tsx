import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export const useProtectedRoute = ({
  redirectTo = '/login',
  requireAuth = true,
}: UseProtectedRouteOptions = {}) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If authentication is required but user is not authenticated, redirect to login
    if (requireAuth && !isAuthenticated) {
      navigate(redirectTo, { state: { from: window.location.pathname } });
    }
    
    // If authentication is not required but user is authenticated, redirect to dashboard
    if (!requireAuth && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate, redirectTo, requireAuth]);

  return { isAuthenticated, loading };
};
