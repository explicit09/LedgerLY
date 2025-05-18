import { renderHook, act } from '@testing-library/react-hooks';
import { useFormSubmit } from '../useFormSubmit';

describe('useFormSubmit', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: jest.fn(),
      })
    );

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.handleSubmit).toBe('function');
  });

  it('should handle successful submission', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });
    const mockData = { name: 'Test' };
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit(mockData);
    });

    expect(mockSubmit).toHaveBeenCalledWith(mockData);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle submission error', async () => {
    const error = new Error('Submission failed');
    const mockSubmit = jest.fn().mockRejectedValue(error);
    const mockData = { name: 'Test' };
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit(mockData);
    });

    expect(mockSubmit).toHaveBeenCalledWith(mockData);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe(error);
  });

  it('should set isSubmitting during submission', async () => {
    const mockSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
      })
    );

    let submissionPromise: Promise<any>;
    act(() => {
      submissionPromise = result.current.handleSubmit({ name: 'Test' });
      expect(result.current.isSubmitting).toBe(true);
    });

    await act(async () => {
      await submissionPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should call onSuccess callback after successful submission', async () => {
    const mockSuccess = jest.fn();
    const mockResponse = { success: true };
    const mockSubmit = jest.fn().mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
        onSuccess: mockSuccess,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ name: 'Test' });
    });

    expect(mockSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('should call onError callback after failed submission', async () => {
    const mockError = jest.fn();
    const error = new Error('Submission failed');
    const mockSubmit = jest.fn().mockRejectedValue(error);
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
        onError: mockError,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ name: 'Test' });
    });

    expect(mockError).toHaveBeenCalledWith(error);
  });

  it('should handle validation before submission', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });
    const mockValidate = jest.fn().mockReturnValue({ name: 'Name is required' });
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
        validate: mockValidate,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ name: '' });
    });

    expect(mockValidate).toHaveBeenCalledWith({ name: '' });
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(result.current.error).toEqual({ name: 'Name is required' });
  });

  it('should reset error state on new submission', async () => {
    const error = new Error('First attempt failed');
    const mockSubmit = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ success: true });
    
    const { result } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
      })
    );

    // First attempt - fails
    await act(async () => {
      await result.current.handleSubmit({ name: 'Test' });
    });

    expect(result.current.error).toBe(error);

    // Second attempt - succeeds
    await act(async () => {
      await result.current.handleSubmit({ name: 'Test' });
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle cleanup on unmount', () => {
    const mockSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    const { result, unmount } = renderHook(() => 
      useFormSubmit({
        onSubmit: mockSubmit,
      })
    );

    act(() => {
      result.current.handleSubmit({ name: 'Test' });
    });

    unmount();

    // Ensure no state updates after unmount
    expect(() => {
      act(() => {
        result.current.handleSubmit({ name: 'Test' });
      });
    }).not.toThrow();
  });
});
