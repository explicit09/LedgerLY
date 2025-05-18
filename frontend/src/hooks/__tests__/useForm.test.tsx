import { renderHook, act } from '@testing-library/react-hooks';
import { useForm, useFormField } from '../useForm';

describe('useForm', () => {
  it('should initialize with default values', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => 
      useForm({
        initialValues,
        onSubmit: jest.fn(),
      })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update field values', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '', email: '' },
        onSubmit: jest.fn(),
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.name).toBe('John');
  });

  it('should validate on submit', async () => {
    const mockSubmit = jest.fn();
    const validate = jest.fn().mockImplementation((values) => {
      const errors: Record<string, string> = {};
      if (!values.name) errors.name = 'Name is required';
      return errors;
    });

    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '', email: '' },
        onSubmit: mockSubmit,
        validate,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(validate).toHaveBeenCalledWith({ name: '', email: '' });
    expect(result.current.errors.name).toBe('Name is required');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit when validation passes', async () => {
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: 'John', email: 'john@example.com' },
        onSubmit: mockSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(mockSubmit).toHaveBeenCalledWith(
      { name: 'John', email: 'john@example.com' },
      expect.any(Object) // formikBag
    );
  });

  it('should handle async submission', async () => {
    const mockSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('success'), 100))
    );
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useForm({
        initialValues: { name: 'John' },
        onSubmit: mockSubmit,
      })
    );

    await act(async () => {
      const promise = result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      expect(result.current.isSubmitting).toBe(true);
      await promise;
    });

    expect(mockSubmit).toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle field blur', () => {
    const { result } = renderHook(() => 
      useForm({
        initialValues: { name: '', email: '' },
        onSubmit: jest.fn(),
      })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'name' }
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.touched.name).toBe(true);
  });
});

describe('useFormField', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useFormField({
        name: 'test',
        initialValue: '',
      })
    );

    expect(result.current.value).toBe('');
    expect(result.current.error).toBeUndefined();
    expect(result.current.touched).toBe(false);
    expect(result.current.dirty).toBe(false);
  });

  it('should update field value', () => {
    const { result } = renderHook(() => 
      useFormField({
        name: 'test',
        initialValue: '',
      })
    );

    act(() => {
      result.current.onChange('new value');
    });

    expect(result.current.value).toBe('new value');
    expect(result.current.dirty).toBe(true);
  });

  it('should validate on blur when validateOnBlur is true', () => {
    const { result } = renderHook(() => 
      useFormField({
        name: 'test',
        initialValue: '',
        validateOnBlur: true,
        validationRules: {
          required: true,
        },
      })
    );

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.touched).toBe(true);
    expect(result.current.error).toBe('This field is required');
  });

  it('should validate on change when validateOnChange is true', () => {
    const { result } = renderHook(() => 
      useFormField({
        name: 'test',
        initialValue: '',
        validateOnChange: true,
        validationRules: {
          required: true,
        },
      })
    );

    act(() => {
      result.current.onChange('');
    });

    expect(result.current.error).toBe('This field is required');
  });

  it('should validate using custom validation function', () => {
    const validate = (value: string) => 
      value.length < 3 ? 'Must be at least 3 characters' : undefined;

    const { result } = renderHook(() => 
      useFormField({
        name: 'test',
        initialValue: '',
        validate,
        validateOnChange: true,
      })
    );

    act(() => {
      result.current.onChange('ab');
    });

    expect(result.current.error).toBe('Must be at least 3 characters');

    act(() => {
      result.current.onChange('abc');
    });

    expect(result.current.error).toBeUndefined();
  });

  it('should reset the field', () => {
    const { result } = renderHook(() => 
      useFormField({
        name: 'test',
        initialValue: 'initial',
      })
    );

    act(() => {
      result.current.onChange('new value');
      result.current.onBlur();
      result.current.setError('Error');
    });

    expect(result.current.value).toBe('new value');
    expect(result.current.touched).toBe(true);
    expect(result.current.error).toBe('Error');
    expect(result.current.dirty).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('initial');
    expect(result.current.touched).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.dirty).toBe(false);
  });
});
