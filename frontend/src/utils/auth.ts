import { ApiError } from './error-handler';
import { User } from '@/types/auth';

/**
 * Checks if the current user has all the required roles
 * @param user The user object
 * @param requiredRoles Array of required role names
 * @returns boolean indicating if the user has all required roles
 */
export const hasRoles = (user: User | null, requiredRoles: string[] = []): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }
  
  if (requiredRoles.length === 0) {
    return true; // No roles required
  }
  
  return requiredRoles.every(role => 
    user.roles?.some(userRole => userRole.name === role)
  );
};

/**
 * Checks if the current user has any of the specified roles
 * @param user The user object
 * @param allowedRoles Array of allowed role names
 * @returns boolean indicating if the user has any of the allowed roles
 */
export const hasAnyRole = (user: User | null, allowedRoles: string[] = []): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }
  
  if (allowedRoles.length === 0) {
    return true; // No roles required
  }
  
  return user.roles.some(role => allowedRoles.includes(role.name));
};

/**
 * Checks if the current user is the owner of a resource
 * @param user The user object
 * @param ownerId The ID of the resource owner
 * @returns boolean indicating if the user is the owner
 */
export const isOwner = (user: User | null, ownerId: string): boolean => {
  return user?.id === ownerId;
};

/**
 * Checks if the current user can access a resource based on ownership or roles
 * @param user The user object
 * @param ownerId The ID of the resource owner
 * @param allowedRoles Array of allowed role names (bypasses ownership check)
 * @returns boolean indicating if the user can access the resource
 */
export const canAccess = (
  user: User | null, 
  ownerId: string, 
  allowedRoles: string[] = []
): boolean => {
  // If user is not authenticated, they can't access anything
  if (!user) return false;
  
  // If user has any of the allowed roles, they can access the resource
  if (hasAnyRole(user, allowedRoles)) {
    return true;
  }
  
  // Otherwise, check if they're the owner
  return isOwner(user, ownerId);
};

/**
 * Parses the JWT token to extract user information
 * Note: This only decodes the token, it doesn't verify the signature
 * @param token The JWT token
 * @returns The decoded token payload or null if invalid
 */
export const parseJwt = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 * @param token The JWT token
 * @returns boolean indicating if the token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};
