import { useState, useCallback } from 'react';
import { isApiError } from '@/types/api';
import { handleFormErrors } from '@/utils/error-handler';

interface UseFormSubmitOptions<T> {
  onSubmit: (values: T) => Promise<any>;
  onSuccess?: (data: any, values: T) => void;
  onError?: (error: Error, values: T) => void;
  onFinally?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

interface FormState<T> {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  submitForm: (values: T) => Promise<void>;
  reset: () => void;
}

/**
 * A custom hook to handle form submissions with loading and error states
 * @param options Configuration options for the form submission
 * @returns Form state and submission handler
 */
export function useFormSubmit<T>(
  options: UseFormSubmitOptions<T>
): FormState<T> {
  const {
    onSubmit,
    onSuccess,
    onError,
    onFinally,
    successMessage,
    errorMessage = 'An error occurred. Please try again.',
  } = options;

  const [state, setState] = useState<{
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
  }>({
    isSubmitting: false,
    error: null,
    success: false,
  });

  const submitForm = useCallback(
    async (values: T) => {
      setState(prev => ({
        ...prev,
        isSubmitting: true,
        error: null,
        success: false,
      }));

      try {
        const data = await onSubmit(values);
        
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          success: true,
        }));
        
        if (onSuccess) {
          onSuccess(data, values);
        }
        
        if (successMessage) {
          // You can integrate with a toast/notification system here
          console.log(successMessage);
        }
      } catch (error) {
        let errorMsg = errorMessage;
        
        if (isApiError(error)) {
          // Handle API errors with more specific messages
          const apiError = error.response?.data?.error;
          errorMsg = apiError?.message || errorMessage;
          
          // Handle form validation errors
          if (apiError?.details) {
            // You can handle form field errors here if needed
            const formErrors = handleFormErrors(error);
            console.log('Form validation errors:', formErrors);
          }
        } else if (error instanceof Error) {
          errorMsg = error.message || errorMessage;
        }
        
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          error: errorMsg,
        }));
        
        if (onError) {
          onError(error as Error, values);
        }
      } finally {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
        }));
        
        if (onFinally) {
          onFinally();
        }
      }
    },
    [onSubmit, onSuccess, onError, onFinally, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    submitForm,
    reset,
  };
}

/**
 * A simplified version of useFormSubmit for basic form submissions
 */
export function useSubmit<T>(
  submitFn: (values: T) => Promise<any>,
  options: Omit<UseFormSubmitOptions<T>, 'onSubmit'> = {}
) {
  return useFormSubmit({
    ...options,
    onSubmit: submitFn,
  });
}

/**
 * A hook for handling form submissions with optimistic updates
 */
export function useOptimisticSubmit<T, R>(
  submitFn: (values: T) => Promise<R>,
  options: {
    onSuccess?: (data: R, values: T) => void;
    onError?: (error: Error, values: T) => void;
    onSettled?: () => void;
  } = {}
) {
  const { onSuccess, onError, onSettled } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (values: T, optimisticData?: R) => {
      setIsLoading(true);
      setError(null);

      try {
        // Call the success callback with optimistic data if provided
        if (onSuccess && optimisticData !== undefined) {
          onSuccess(optimisticData, values);
        }

        // Perform the actual submission
        const result = await submitFn(values);

        // Call the success callback with the actual result
        if (onSuccess) {
          onSuccess(result, values);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (onError) {
          onError(error, values);
        }

        throw error;
      } finally {
        setIsLoading(false);
        
        if (onSettled) {
          onSettled();
        }
      }
    },
    [submitFn, onSuccess, onError, onSettled]
  );

  return {
    submit,
    isLoading,
    error,
  };
}
