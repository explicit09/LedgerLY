import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock the API calls
jest.mock('@/lib/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock the token utility
jest.mock('@/utils/token', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  removeToken: jest.fn(),
}));

const api = require('@/lib/api');
const tokenUtils = require('@/utils/token');

describe('useAuth', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
  };

  const mockAuthResponse = {
    user: mockUser,
    token: 'test-token',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    tokenUtils.getToken.mockReturnValue(null);
    api.get.mockResolvedValue({ data: { user: null } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should login successfully', async () => {
    // Mock successful login response
    api.post.mockResolvedValueOnce({ data: mockAuthResponse });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
    
    expect(tokenUtils.setToken).toHaveBeenCalledWith('test-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle login error', async () => {
    // Mock failed login
    const error = new Error('Invalid credentials');
    api.post.mockRejectedValueOnce(error);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    await act(async () => {
      await expect(
        result.current.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should register a new user', async () => {
    // Mock successful registration
    api.post.mockResolvedValueOnce({ data: mockAuthResponse });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
    };

    await act(async () => {
      await result.current.register(userData);
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
    expect(tokenUtils.setToken).toHaveBeenCalledWith('test-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should logout the user', async () => {
    // Mock initial auth state with a logged-in user
    tokenUtils.getToken.mockReturnValueOnce('test-token');
    api.get.mockResolvedValueOnce({ data: { user: mockUser } });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(tokenUtils.removeToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should check if user has required roles', async () => {
    // Mock initial auth state with a logged-in user with admin role
    tokenUtils.getToken.mockReturnValueOnce('test-token');
    api.get.mockResolvedValueOnce({ 
      data: { 
        user: { ...mockUser, roles: ['admin', 'editor'] } 
      } 
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    expect(result.current.hasRoles(['admin'])).toBe(true);
    expect(result.current.hasRoles(['admin', 'editor'])).toBe(true);
    expect(result.current.hasRoles(['superadmin'])).toBe(false);
    expect(result.current.hasRoles([])).toBe(true);
  });

  it('should handle token refresh', async () => {
    // Mock token refresh flow
    tokenUtils.getToken.mockReturnValueOnce('expired-token');
    api.get
      .mockRejectedValueOnce({ response: { status: 401 } }) // First /auth/me call fails
      .mockResolvedValueOnce({ data: { token: 'new-token' } }) // Token refresh succeeds
      .mockResolvedValueOnce({ data: { user: mockUser } }); // Second /auth/me call succeeds
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for the refresh flow to complete
    await waitForNextUpdate();
    await waitForNextUpdate();
    await waitForNextUpdate();

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(api.get).toHaveBeenCalledWith('/auth/refresh');
    expect(tokenUtils.setToken).toHaveBeenCalledWith('new-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle password reset request', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Reset email sent' } });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    await act(async () => {
      await result.current.requestPasswordReset('test@example.com');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/password-reset-request', {
      email: 'test@example.com',
    });
  });

  it('should handle password reset confirmation', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Password reset successful' } });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    const resetData = {
      token: 'reset-token',
      password: 'new-password',
    };

    await act(async () => {
      await result.current.resetPassword(resetData);
    });

    expect(api.post).toHaveBeenCalledWith('/auth/password-reset', resetData);
  });

  it('should update user profile', async () => {
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    api.post.mockResolvedValueOnce({ data: { user: updatedUser } });
    
    // Start with logged in user
    tokenUtils.getToken.mockReturnValueOnce('test-token');
    api.get.mockResolvedValueOnce({ data: { user: mockUser } });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    await act(async () => {
      await result.current.updateProfile({ name: 'Updated Name' });
    });

    expect(api.post).toHaveBeenCalledWith('/auth/profile', { name: 'Updated Name' });
    expect(result.current.user).toEqual(updatedUser);
  });

  it('should handle session expiration', async () => {
    // Mock initial auth state with a logged-in user
    tokenUtils.getToken.mockReturnValueOnce('test-token');
    api.get.mockResolvedValueOnce({ data: { user: mockUser } });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check to complete
    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(true);

    // Simulate session expiration
    await act(async () => {
      result.current.handleSessionExpired();
    });

    expect(tokenUtils.removeToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
