# Authentication System

This directory contains the authentication system for the LedgerLY application. It includes components, hooks, and utilities for handling user authentication, including login, registration, password reset, and protected routes.

## Features

- **Authentication Context**: Centralized state management for authentication
- **Protected Routes**: HOC for securing routes that require authentication
- **Form Handling**: Custom hooks for form state and validation
- **API Integration**: Axios instance with token management
- **User Session Management**: Token storage and refresh logic

## Components

### `AuthProvider`

A context provider that manages the authentication state and provides authentication methods to child components.

```tsx
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
```

### `withAuth` HOC

A higher-order component that protects routes from unauthorized access.

```tsx
import { withAuth } from '@/hocs/withAuth';

// Basic usage
const ProtectedDashboard = withAuth(Dashboard);

// With role-based access control
const AdminDashboard = withAuth(Dashboard, {
  requiredRoles: ['admin'],
  redirectTo: '/unauthorized',
});
```

## Hooks

### `useAuth`

A hook that provides access to the authentication context.

```tsx
import { useAuth } from '@/hooks/useAuth';

function UserProfile() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### `useForm` and `useFormField`

Hooks for managing form state and validation.

```tsx
import { useForm, useFormField } from '@/hooks/useForm';

function LoginForm() {
  const { formState, handleChange, handleSubmit, errors } = useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      // Handle login
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.email) errors.email = 'Email is required';
      if (!values.password) errors.password = 'Password is required';
      return errors;
    },
  });
  
  // Or use individual field hooks
  const emailField = useFormField({
    name: 'email',
    initialValue: '',
    validationRules: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  });
  
  // ...
}
```

## API Integration

The authentication system includes an Axios instance with request/response interceptors for handling authentication tokens.

```typescript
import api from '@/lib/api';

// Make authenticated requests
const fetchUserData = async () => {
  try {
    const response = await api.get('/api/user');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user data', error);
    throw error;
  }
};
```

## Error Handling

Custom error handling utilities are provided for consistent error messages and handling.

```typescript
import { handleApiError } from '@/utils/error-handler';

async function fetchData() {
  try {
    const response = await api.get('/api/data');
    return response.data;
  } catch (error) {
    // Handle API errors consistently
    const errorMessage = handleApiError(error);
    console.error('API Error:', errorMessage);
    // Show error to user
  }
}
```

## Environment Variables

The following environment variables are required:

```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME=LedgerLY
# Optional: Set to 'true' to enable debug logging
REACT_APP_DEBUG=true
```

## Best Practices

1. **Use the `withAuth` HOC** for any component that requires authentication.
2. **Use the `useAuth` hook** to access authentication state and methods.
3. **Use form hooks** for consistent form handling and validation.
4. **Handle API errors** using the provided error handling utilities.
5. **Keep authentication logic** in the authentication context to maintain a single source of truth.

## Testing

Test files should be placed alongside the components/hooks they test with a `.test.tsx` or `.spec.tsx` extension. Use the `@testing-library/react` library for testing React components.

## Contributing

When making changes to the authentication system:

1. Update the relevant documentation
2. Add or update tests
3. Ensure backward compatibility or provide migration steps
4. Follow the project's coding standards

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
