import { useState, useCallback } from 'react';
import { validateForm, ValidationRules, ValidationResult } from '../utils/validation';

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRules>>;
  onSubmit: (values: T) => Promise<void> | void;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    if (Object.keys(validationRules).length === 0) return true;
    
    const { isValid, errors: validationErrors } = validateForm(
      values as Record<string, string>,
      validationRules as Record<string, ValidationRules>
    ) as { isValid: boolean; errors: Record<keyof T, string> };
    
    setErrors(validationErrors);
    return isValid;
  }, [values, validationRules]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Handle checkboxes and other input types if needed
      const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
      
      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      
      // Clear error for the field being edited
      if (errors[name as keyof T]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as keyof T];
          return newErrors;
        });
      }
      
      // Clear submit error when user starts typing
      if (submitError) {
        setSubmitError(null);
      }
    },
    [errors, submitError]
  );

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for the field being set
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      const isValid = validate();
      if (!isValid) return false;
      
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        await onSubmit(values);
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setSubmitError(errorMessage);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate, values]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit,
    setFieldValue,
    setValues,
    setErrors,
    resetForm,
  };
};

export default useForm;
