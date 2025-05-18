import { ComponentType, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface WithAuthProps {
  // You can add any additional props that the wrapped component might need
}

/**
 * Higher-Order Component that protects a route and redirects to login if not authenticated
 * @param WrappedComponent The component to protect
 * @param options Configuration options for the HOC
 * @returns A new component with auth protection
 */
function withAuth<T extends WithAuthProps>(
  WrappedComponent: ComponentType<T>,
  options: {
    /**
     * If true, the user will be redirected to the login page if they are not authenticated
     * @default true
     */
    requireAuth?: boolean;
    
    /**
     * Array of required roles that the user must have to access the component
     * If empty, no specific roles are required (only authentication is checked)
     */
    requiredRoles?: string[];
    
    /**
     * The path to redirect to if the user is not authenticated
     * @default '/login'
     */
    redirectTo?: string;
    
    /**
     * If true, the user will be redirected to this path if they are already authenticated
     * This is useful for auth pages like login/register that should only be accessible to guests
     */
    redirectIfAuthenticated?: string;
  } = {}
) {
  const {
    requireAuth = true,
    requiredRoles = [],
    redirectTo = '/login',
    redirectIfAuthenticated,
  } = options;

  // Return a new component
  return function WithAuthWrapper(props: T) {
    const { isAuthenticated, isLoading, user, hasRoles } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      // If we're still loading, do nothing
      if (isLoading) return;

      // Handle redirect if user is authenticated but shouldn't be
      if (redirectIfAuthenticated && isAuthenticated) {
        // Get the redirect location from state or use the default
        const from = (location.state as any)?.from?.pathname || redirectIfAuthenticated;
        navigate(from, { replace: true });
        return;
      }

      // Handle authentication and authorization checks
      if (requireAuth) {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
          // Save the current location to redirect back after login
          const from = location.pathname + location.search;
          navigate(redirectTo, { state: { from }, replace: true });
          return;
        }

        // Check if user has required roles
        if (requiredRoles.length > 0 && !hasRoles(requiredRoles)) {
          // Redirect to unauthorized page or home if user doesn't have required roles
          navigate('/unauthorized', { replace: true });
          return;
        }
      }
    }, [isAuthenticated, isLoading, navigate, location, hasRoles]);

    // Show loading state while checking auth
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    // If we're redirecting, don't render anything
    if (redirectIfAuthenticated && isAuthenticated) {
      return null;
    }

    // If authentication is required and user is not authenticated, don't render
    if (requireAuth && !isAuthenticated) {
      return null;
    }

    // Check if user has required roles
    if (requireAuth && requiredRoles.length > 0 && !hasRoles(requiredRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    // Render the wrapped component with all its props
    return <WrappedComponent {...props} />;
  };
}

export default withAuth;
