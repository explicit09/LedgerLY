import React from 'react';
import Label from '../atoms/Label';
import Input, { type InputProps } from '../atoms/Input';

interface FormFieldProps extends Omit<InputProps, 'id'> {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  labelSize?: 'sm' | 'md' | 'lg';
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  helpText,
  labelSize = 'md',
  status = 'default',
  className = '',
  ...inputProps
}) => {
  // If there's an error, override the status
  const inputStatus = error ? 'error' : status;

  return (
    <div className={`mb-4 ${className}`}>
      <Label
        htmlFor={id}
        required={required}
        labelSize={labelSize}
      >
        {label}
      </Label>
      
      <Input
        id={id}
        status={inputStatus}
        aria-describedby={
          error ? `${id}-error` : helpText ? `${id}-help` : undefined
        }
        {...inputProps}
      />

      {/* Error message */}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Help text */}
      {!error && helpText && (
        <p
          id={`${id}-help`}
          className="mt-1 text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField; 