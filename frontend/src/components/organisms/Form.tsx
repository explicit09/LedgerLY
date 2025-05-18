import React from 'react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import Alert from '../molecules/Alert';

export interface FormField {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: (value: string) => string | undefined;
}

interface FormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
  submitText?: string;
  className?: string;
  initialValues?: Record<string, string>;
}

const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  submitText = 'Submit',
  className = '',
  initialValues = {},
}) => {
  const [values, setValues] = React.useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string>();

  const handleChange = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
    // Clear error when field is modified
    if (errors[id]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = values[field.id] || '';

      // Required field validation
      if (field.required && !value.trim()) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      // Custom field validation
      if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.id] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(undefined);

    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {submitError && (
        <Alert
          variant="error"
          className="mb-4"
          onDismiss={() => setSubmitError(undefined)}
        >
          {submitError}
        </Alert>
      )}

      {fields.map(field => (
        <FormField
          key={field.id}
          id={field.id}
          label={field.label}
          type={field.type || 'text'}
          required={field.required}
          placeholder={field.placeholder}
          helpText={field.helpText}
          value={values[field.id] || ''}
          onChange={e => handleChange(field.id, e.target.value)}
          error={errors[field.id]}
          className="mb-4"
        />
      ))}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default Form; 