import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';
import { useFormField } from '@/hooks/useFormField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Example component demonstrating the authentication flow
 * using the custom hooks and components we've created
 */
const AuthExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Example using useForm hook
  const loginForm = useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      try {
        await login(values);
        navigate('/dashboard');
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.email) errors.email = 'Email is required';
      if (!values.password) errors.password = 'Password is required';
      return errors;
    },
  });

  // Example using individual useFormField hooks
  const registerName = useFormField({
    name: 'name',
    initialValue: '',
    validationRules: {
      required: true,
      minLength: 3,
    },
  });

  const registerEmail = useFormField({
    name: 'email',
    initialValue: '',
    validationRules: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  });

  const registerPassword = useFormField({
    name: 'password',
    initialValue: '',
    validationRules: {
      required: true,
      minLength: 6,
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = registerName.validateField();
    const isEmailValid = registerEmail.validateField();
    const isPasswordValid = registerPassword.validateField();
    
    if (isNameValid && isEmailValid && isPasswordValid) {
      try {
        await register({
          name: registerName.value,
          email: registerEmail.value,
          password: registerPassword.value,
        });
        navigate('/dashboard');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Welcome back!</h2>
          <p className="text-center mb-6">You are already logged in as {user?.email}.</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => {
              // Logout logic would go here
            }}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('register')}
          >
            Create Account
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={loginForm.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={loginForm.values.email}
                onChange={(e) => loginForm.setFieldValue('email', e.target.value)}
                onBlur={() => loginForm.setFieldTouched('email', true)}
                className="w-full"
              />
              {loginForm.touched.email && loginForm.errors.email && (
                <p className="mt-1 text-sm text-red-600">{loginForm.errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={loginForm.values.password}
                onChange={(e) => loginForm.setFieldValue('password', e.target.value)}
                onBlur={() => loginForm.setFieldTouched('password', true)}
                className="w-full"
              />
              {loginForm.touched.password && loginForm.errors.password && (
                <p className="mt-1 text-sm text-red-600">{loginForm.errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loginForm.isSubmitting}>
              {loginForm.isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={registerName.value}
                onChange={(e) => registerName.onChange(e.target.value)}
                onBlur={registerName.onBlur}
                className="w-full"
              />
              {registerName.touched && registerName.error && (
                <p className="mt-1 text-sm text-red-600">{registerName.error}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="register-email"
                type="email"
                value={registerEmail.value}
                onChange={(e) => registerEmail.onChange(e.target.value)}
                onBlur={registerEmail.onBlur}
                className="w-full"
              />
              {registerEmail.touched && registerEmail.error && (
                <p className="mt-1 text-sm text-red-600">
                  {registerEmail.error.includes('pattern') ? 'Please enter a valid email address' : registerEmail.error}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="register-password"
                type="password"
                value={registerPassword.value}
                onChange={(e) => registerPassword.onChange(e.target.value)}
                onBlur={registerPassword.onBlur}
                className="w-full"
              />
              {registerPassword.touched && registerPassword.error && (
                <p className="mt-1 text-sm text-red-600">
                  {registerPassword.error.includes('minLength') 
                    ? 'Password must be at least 6 characters' 
                    : registerPassword.error}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={false /* Add loading state */}>
              Create Account
            </Button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.156 20 14.415 20 10c0-5.523-4.477-10-10-10z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </Button>
            <Button variant="outline" className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                  clipRule="evenodd"
                />
              </svg>
              Facebook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthExample;
