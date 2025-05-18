import { useState, useCallback } from 'react';
import { useForm } from './useForm';
import { emailRegex } from '@/utils/validation';
import { passwordRules } from '@/utils/validation';

type AuthMode = 'login' | 'register' | 'forgotPassword' | 'resetPassword';

interface AuthFormFields {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
  token?: string;
}

interface UseAuthFormOptions {
  mode: AuthMode;
  onSubmit: (values: AuthFormFields) => Promise<void>;
  initialValues?: Partial<AuthFormFields>;
}

export function useAuthForm({ mode, onSubmit, initialValues = {} }: UseAuthFormOptions) {
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Define validation rules based on the form mode
  const getValidationRules = useCallback(() => {
    const rules: Record<string, any> = {};
    
    if (mode === 'login' || mode === 'register' || mode === 'resetPassword') {
      rules.email = {
        required: true,
        pattern: {
          value: emailRegex,
          message: 'Please enter a valid email address',
        },
      };
    }
    
    if (mode === 'login' || mode === 'register' || mode === 'resetPassword') {
      rules.password = {
        ...passwordRules,
        required: true,
      };
    }
    
    if (mode === 'register') {
      rules.name = {
        required: true,
        minLength: 2,
        maxLength: 50,
      };
      
      rules.confirmPassword = {
        required: true,
        validate: (value: string, values: AuthFormFields) => 
          value === values.password || 'Passwords do not match',
      };
    }
    
    if (mode === 'resetPassword') {
      rules.token = {
        required: true,
      };
    }
    
    return rules;
  }, [mode]);
  
  // Initialize form with useForm hook
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit: handleFormSubmit,
    setFieldValue,
    setErrors,
    resetForm,
  } = useForm<AuthFormFields>({
    initialValues: {
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
      token: '',
      ...initialValues,
    },
    validationRules: getValidationRules(),
    onSubmit: async (values) => {
      try {
        setServerError(null);
        await onSubmit(values);
      } catch (error: any) {
        const errorMessage = error?.message || 'An error occurred. Please try again.';
        setServerError(errorMessage);
        
        // Handle field-specific errors if available
        if (error?.fields) {
          setErrors(error.fields);
        }
        
        // Re-throw the error to be handled by the form if needed
        throw error;
      }
    },
  });
  
  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleFormSubmit(e);
    },
    [handleFormSubmit]
  );
  
  // Helper to handle input change events
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      handleChange(name as keyof AuthFormFields, value);
    },
    [handleChange]
  );
  
  // Helper to handle checkbox change events
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      handleChange(name as keyof AuthFormFields, checked);
    },
    [handleChange]
  );
  
  // Helper to handle select change events
  const handleSelectChange = useCallback(
    (name: keyof AuthFormFields) => (value: any) => {
      setFieldValue(name, value);
    },
    [setFieldValue]
  );
  
  // Determine if the form is valid
  const isValid = Object.keys(errors).length === 0;
  
  return {
    // Form state
    values,
    errors,
    isSubmitting,
    serverError,
    isValid,
    
    // Event handlers
    handleChange: handleInputChange,
    handleCheckboxChange,
    handleSelectChange,
    handleSubmit,
    
    // Form actions
    setFieldValue,
    setErrors,
    resetForm,
    setServerError,
  };
}
