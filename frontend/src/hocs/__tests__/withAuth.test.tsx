import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { withAuth } from '../withAuth';

// Mock components for testing
const PublicPage = () => <div>Public Page</div>;
const ProtectedPage = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;
const UnauthorizedPage = () => <div>Unauthorized</div>;

// Create a test component that uses withAuth
const TestRouter = ({ isAuthenticated = false, userRoles = [] as string[] }) => {
  const ProtectedComponent = withAuth(ProtectedPage, {
    requireAuth: true,
    requiredRoles: ['admin'],
    redirectTo: '/login',
    redirectIfAuthenticated: '/dashboard',
  });

  return (
    <AuthProvider 
      initialAuthState={{ 
        isAuthenticated, 
        user: isAuthenticated ? { id: '1', email: 'test@example.com', roles: userRoles } : null 
      }}
    >
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/public" element={<PublicPage />} />
          <Route path="/protected" element={<ProtectedComponent />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('withAuth HOC', () => {
  it('redirects to login when user is not authenticated', async () => {
    render(<TestRouter isAuthenticated={false} />);
    
    // Should show loading state first
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // After auth check, should redirect to login
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders protected content when user is authenticated with required role', async () => {
    render(<TestRouter isAuthenticated={true} userRoles={['admin']} />);
    
    // Should show loading state first
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // After auth check, should show protected content
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects to unauthorized when user lacks required role', async () => {
    render(<TestRouter isAuthenticated={true} userRoles={['user']} />);
    
    // Should show loading state first
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // After auth check, should redirect to unauthorized
    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  it('redirects away from auth pages when already authenticated', async () => {
    // Test the redirectIfAuthenticated functionality
    render(
      <AuthProvider 
        initialAuthState={{ 
          isAuthenticated: true, 
          user: { id: '1', email: 'test@example.com', roles: ['user'] } 
        }}
      >
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    
    // Should redirect to dashboard when already authenticated
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('does not protect routes when requireAuth is false', async () => {
    const UnprotectedComponent = withAuth(PublicPage, {
      requireAuth: false,
    });
    
    render(
      <AuthProvider initialAuthState={{ isAuthenticated: false, user: null }}>
        <MemoryRouter initialEntries={['/public']}>
          <Routes>
            <Route path="/public" element={<UnprotectedComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    
    // Should render public content without authentication
    expect(screen.getByText('Public Page')).toBeInTheDocument();
  });

  it('preserves the original component props', async () => {
    const ComponentWithProps = ({ message }: { message: string }) => (
      <div>{message}</div>
    );
    
    const ProtectedWithProps = withAuth(ComponentWithProps, {
      requireAuth: true,
    });
    
    render(
      <AuthProvider 
        initialAuthState={{ 
          isAuthenticated: true, 
          user: { id: '1', email: 'test@example.com', roles: ['user'] } 
        }}
      >
        <MemoryRouter>
          <ProtectedWithProps message="Hello, World!" />
        </MemoryRouter>
      </AuthProvider>
    );
    
    // Should render the component with its original props
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('handles navigation state for redirects', async () => {
    render(
      <AuthProvider initialAuthState={{ isAuthenticated: false, user: null }}>
        <MemoryRouter initialEntries={['/protected?from=settings']}>
          <Routes>
            <Route 
              path="/login" 
              element={
                <div>
                  <div>Login Page</div>
                  <div>From: {new URLSearchParams(window.location.search).get('from')}</div>
                </div>
              } 
            />
            <Route 
              path="/protected" 
              element={withAuth(() => <div>Protected</div>, {
                requireAuth: true,
                redirectTo: '/login',
              })()}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    
    // Should redirect to login with the original location in state
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.getByText('From: settings')).toBeInTheDocument();
    });
  });
});

// Test the hasRoles utility function
describe('hasRoles utility', () => {
  it('returns true when user has all required roles', () => {
    const { hasRoles } = require('../withAuth');
    const userRoles = ['admin', 'editor'];
    expect(hasRoles(userRoles, ['admin'])).toBe(true);
    expect(hasRoles(userRoles, ['admin', 'editor'])).toBe(true);
  });

  it('returns false when user is missing required roles', () => {
    const { hasRoles } = require('../withAuth');
    const userRoles = ['user'];
    expect(hasRoles(userRoles, ['admin'])).toBe(false);
    expect(hasRoles(userRoles, ['admin', 'editor'])).toBe(false);
  });

  it('returns true when no roles are required', () => {
    const { hasRoles } = require('../withAuth');
    const userRoles = ['user'];
    expect(hasRoles(userRoles, [])).toBe(true);
    expect(hasRoles(userRoles, undefined)).toBe(true);
  });

  it('handles undefined user roles', () => {
    const { hasRoles } = require('../withAuth');
    expect(hasRoles(undefined, ['admin'])).toBe(false);
    expect(hasRoles(null, ['admin'])).toBe(false);
    expect(hasRoles([], ['admin'])).toBe(false);
  });
});
