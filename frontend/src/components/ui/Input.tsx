import React, { InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperTextClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  label,
  error,
  fullWidth = false,
  helperText,
  startAdornment,
  endAdornment,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helperTextClassName = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  
  const baseContainerStyles = 'flex flex-col space-y-1';
  const baseLabelStyles = 'block text-sm font-medium text-gray-700';
  const baseInputStyles = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';
  const baseErrorStyles = 'mt-1 text-sm text-red-600';
  const baseHelperTextStyles = 'mt-1 text-sm text-gray-500';
  
  const errorInputStyles = hasError 
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500' 
    : '';
    
  const disabledStyles = props.disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const fullWidthStyles = fullWidth ? 'w-full' : '';
  
  const inputWithAdornmentStyles = startAdornment || endAdornment 
    ? 'flex rounded-md shadow-sm' 
    : '';

  return (
    <div className={twMerge(baseContainerStyles, fullWidthStyles, containerClassName)}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={twMerge(baseLabelStyles, labelClassName)}
        >
          {label}
        </label>
      )}
      
      <div className={inputWithAdornmentStyles}>
        {startAdornment && (
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
            {startAdornment}
          </span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            baseInputStyles,
            errorInputStyles,
            disabledStyles,
            startAdornment ? 'rounded-none rounded-r-md' : 'rounded-md',
            endAdornment ? 'rounded-none rounded-l-md' : '',
            startAdornment && endAdornment ? 'rounded-none' : '',
            fullWidthStyles,
            className,
            inputClassName
          )}
          {...props}
        />
        
        {endAdornment && (
          <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
            {endAdornment}
          </span>
        )}
      </div>
      
      {hasError && (
        <p className={twMerge(baseErrorStyles, errorClassName)}>
          {error}
        </p>
      )}
      
      {helperText && !hasError && (
        <p className={twMerge(baseHelperTextStyles, helperTextClassName)}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
