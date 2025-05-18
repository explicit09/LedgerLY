import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { User } from '@/types/auth';
import { isTokenExpired } from '@/utils/auth';
import { getToken } from '@/utils/token';

/**
 * Custom hook to access authentication context and provide authentication utilities
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, isAuthenticated, isLoading, error, ...authContext } = context;

  /**
   * Checks if the current user has all the required roles
   * @param requiredRoles Array of required role names
   * @returns boolean indicating if the user has all required roles
   */
  const hasRoles = (requiredRoles: string[] = []): boolean => {
    if (!user || !user.roles) return false;
    if (requiredRoles.length === 0) return true;
    
    return requiredRoles.every(role => 
      user.roles?.some(userRole => userRole.name === role)
    );
  };

  /**
   * Checks if the current user has any of the specified roles
   * @param allowedRoles Array of allowed role names
   * @returns boolean indicating if the user has any of the allowed roles
   */
  const hasAnyRole = (allowedRoles: string[] = []): boolean => {
    if (!user || !user.roles) return false;
    if (allowedRoles.length === 0) return true;
    
    return user.roles.some(role => allowedRoles.includes(role.name));
  };

  /**
   * Checks if the current user is the owner of a resource
   * @param ownerId The ID of the resource owner
   * @returns boolean indicating if the user is the owner
   */
  const isOwner = (ownerId: string): boolean => {
    return user?.id === ownerId;
  };

  /**
   * Checks if the current user can access a resource based on ownership or roles
   * @param ownerId The ID of the resource owner
   * @param allowedRoles Array of allowed role names (bypasses ownership check)
   * @returns boolean indicating if the user can access the resource
   */
  const canAccess = (ownerId: string, allowedRoles: string[] = []): boolean => {
    // If user is not authenticated, they can't access anything
    if (!isAuthenticated) return false;
    
    // If user has any of the allowed roles, they can access the resource
    if (hasAnyRole(allowedRoles)) {
      return true;
    }
    
    // Otherwise, check if they're the owner
    return isOwner(ownerId);
  };

  /**
   * Redirects the user to the login page and saves the current location
   * so they can be redirected back after logging in
   */
  const redirectToLogin = () => {
    // Save the current location to redirect back after login
    const from = location.pathname + location.search;
    navigate('/login', { state: { from }, replace: true });
  };

  /**
   * Checks if the current session is valid
   * @returns boolean indicating if the session is valid
   */
  const isSessionValid = (): boolean => {
    if (!isAuthenticated) return false;
    
    const token = getToken();
    if (!token) return false;
    
    // Check if token is expired
    return !isTokenExpired(token);
  };

  return {
    // User information
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Auth methods
    ...authContext,
    
    // Role-based access control
    hasRoles,
    hasAnyRole,
    isOwner,
    canAccess,
    
    // Utilities
    redirectToLogin,
    isSessionValid,
  };
};

export default useAuth;
