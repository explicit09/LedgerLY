import { useState, useCallback, useRef } from 'react';

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface UseAsyncOptions<T extends any[], R> {
  onSuccess?: (result: R, args: T) => void;
  onError?: (error: Error, args: T) => void;
  onFinally?: () => void;
  throwOnError?: boolean;
}

interface UseAsyncResult<T extends any[], R> {
  execute: (...args: T) => Promise<R | undefined>;
  loading: boolean;
  error: Error | null;
  result: R | null;
  reset: () => void;
}

/**
 * A hook to handle asynchronous operations with loading, error, and result states
 * 
 * @param asyncFunction The async function to execute
 * @param options Configuration options
 * @returns An object containing the execute function and state values
 */
export function useAsync<T extends any[], R>(
  asyncFunction: AsyncFunction<T, R>,
  options: UseAsyncOptions<T, R> = {}
): UseAsyncResult<T, R> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<R | null>(null);
  const isMounted = useRef(true);

  // Set isMounted to false when the component unmounts
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: T): Promise<R | undefined> => {
      if (!isMounted.current) return;
      
      setLoading(true);
      setError(null);

      try {
        const response = await asyncFunction(...args);
        
        if (isMounted.current) {
          setResult(response);
          options.onSuccess?.(response, args);
        }
        
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (isMounted.current) {
          setError(error);
          options.onError?.(error, args);
        }
        
        if (options.throwOnError) {
          throw error;
        }
        
        return undefined;
      } finally {
        if (isMounted.current) {
          setLoading(false);
          options.onFinally?.();
        }
      }
    },
    [asyncFunction, options]
  );

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setLoading(false);
  }, []);

  return {
    execute,
    loading,
    error,
    result,
    reset,
  };
}

/**
 * A simplified version of useAsync that doesn't track the result
 */
export function useAsyncCallback<T extends any[]>(
  asyncFunction: (...args: T) => Promise<void>,
  options: Omit<UseAsyncOptions<T, void>, 'onSuccess'> & {
    onSuccess?: () => void;
  } = {}
) {
  const { execute, loading, error, reset } = useAsync(
    asyncFunction as AsyncFunction<T, void>,
    options
  );

  return {
    execute,
    loading,
    error,
    reset,
  };
}
