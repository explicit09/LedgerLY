import { useState, useCallback, useEffect } from 'react';
import { ValidationRules, ValidationResult } from '../types/validation';

interface UseFormFieldOptions<T> {
  name: string;
  initialValue: T;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validationRules?: ValidationRules;
  validate?: (value: T) => string | undefined;
}

interface FormFieldState<T> {
  value: T;
  error: string | undefined;
  touched: boolean;
  dirty: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
  setValue: (value: T) => void;
  setError: (error: string | undefined) => void;
  validateField: () => boolean;
  reset: () => void;
}

/**
 * A custom hook to manage form field state, validation, and interactions
 * @param options Configuration options for the form field
 * @returns Form field state and handlers
 */
export function useFormField<T>(
  options: UseFormFieldOptions<T>
): FormFieldState<T> {
  const {
    name,
    initialValue,
    validateOnChange = false,
    validateOnBlur = true,
    validationRules,
    validate,
  } = options;

  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Validate the field value based on the provided rules
  const validateField = useCallback((): boolean => {
    if (!validationRules) return true;

    // Check required field
    if (validationRules.required) {
      if (value === undefined || value === null || value === '') {
        setError(`${name} is required`);
        return false;
      }
    }

    // Check min length for strings and arrays
    if (validationRules.minLength !== undefined) {
      if (
        (typeof value === 'string' && value.length < validationRules.minLength) ||
        (Array.isArray(value) && value.length < validationRules.minLength)
      ) {
        setError(
          `${name} must be at least ${validationRules.minLength} characters`
        );
        return false;
      }
    }

    // Check max length for strings and arrays
    if (validationRules.maxLength !== undefined) {
      if (
        (typeof value === 'string' && value.length > validationRules.maxLength) ||
        (Array.isArray(value) && value.length > validationRules.maxLength)
      ) {
        setError(
          `${name} must be at most ${validationRules.maxLength} characters`
        );
        return false;
      }
    }

    // Check min value for numbers
    if (validationRules.min !== undefined && typeof value === 'number' && value < validationRules.min) {
      setError(`${name} must be at least ${validationRules.min}`);
      return false;
    }

    // Check max value for numbers
    if (validationRules.max !== undefined && typeof value === 'number' && value > validationRules.max) {
      setError(`${name} must be at most ${validationRules.max}`);
      return false;
    }

    // Check pattern match for strings
    if (validationRules.pattern && typeof value === 'string') {
      const pattern = validationRules.pattern;
      
      if (typeof pattern === 'string') {
        try {
          const regex = new RegExp(pattern);
          if (!regex.test(value)) {
            setError(`${name} is invalid`);
            return false;
          }
        } catch (e) {
          console.error('Invalid regex pattern:', pattern);
          setError('Invalid validation pattern');
          return false;
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(value)) {
          setError(`${name} is invalid`);
          return false;
        }
      } else if (pattern && typeof pattern === 'object' && 'value' in pattern) {
        try {
          const regex = pattern.value instanceof RegExp 
            ? pattern.value 
            : new RegExp(pattern.value);
          if (!regex.test(value)) {
            setError(pattern.message || `${name} is invalid`);
            return false;
          }
        } catch (e) {
          console.error('Invalid regex pattern:', pattern);
          setError('Invalid validation pattern');
          return false;
        }
      }
    }

    // Custom validation function
    if (validate) {
      const customError = validate(value);
      if (customError) {
        setError(customError);
        return false;
      }
    }

    // If all validations pass
    setError(undefined);
    return true;
  }, [name, value, validationRules, validate]);

  // Handle field value change
  const handleChange = useCallback(
    (newValue: T) => {
      setValue(newValue);
      setDirty(true);

      if (validateOnChange) {
        validateField();
      } else {
        // Clear error when user starts typing again
        setError(undefined);
      }
    },
    [validateField, validateOnChange]
  );

  // Handle field blur
  const handleBlur = useCallback(() => {
    setTouched(true);
    
    if (validateOnBlur) {
      validateField();
    }
  }, [validateField, validateOnBlur]);

  // Reset the field to its initial state
  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
    setDirty(false);
  }, [initialValue]);

  // Validate when validation rules change
  useEffect(() => {
    if (dirty) {
      validateField();
    }
  }, [validateField, dirty]);

  return {
    value,
    error,
    touched,
    dirty,
    onChange: handleChange,
    onBlur: handleBlur,
    setValue,
    setError,
    validateField,
    reset,
  };
}

/**
 * A simplified version of useFormField for string inputs
 */
export function useTextField(
  name: string,
  initialValue: string = '',
  options: Omit<UseFormFieldOptions<string>, 'name' | 'initialValue'> = {}
) {
  return useFormField<string>({
    name,
    initialValue,
    ...options,
  });
}

/**
 * A simplified version of useFormField for number inputs
 */
export function useNumberField(
  name: string,
  initialValue: number = 0,
  options: Omit<UseFormFieldOptions<number>, 'name' | 'initialValue'> = {}
) {
  return useFormField<number>({
    name,
    initialValue,
    ...options,
  });
}

/**
 * A simplified version of useFormField for boolean inputs (checkboxes, switches)
 */
export function useBooleanField(
  name: string,
  initialValue: boolean = false,
  options: Omit<UseFormFieldOptions<boolean>, 'name' | 'initialValue'> = {}
) {
  return useFormField<boolean>({
    name,
    initialValue,
    ...options,
  });
}

/**
 * A simplified version of useFormField for select inputs
 */
export function useSelectField<T>(
  name: string,
  initialValue: T,
  options: Omit<UseFormFieldOptions<T>, 'name' | 'initialValue'> = {}
) {
  return useFormField<T>({
    name,
    initialValue,
    ...options,
  });
}
