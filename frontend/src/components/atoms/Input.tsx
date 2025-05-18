import React, { InputHTMLAttributes } from 'react';

type InputSize = 'sm' | 'md' | 'lg';
type InputStatus = 'default' | 'error' | 'success';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  status?: InputStatus;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
  inputSize = 'md',
  status = 'default',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'rounded border transition-colors duration-200 focus:outline-none focus:ring-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const statusClasses = {
    default: 'border-gray-300 focus:border-primary focus:ring-primary/20',
    error: 'border-danger focus:border-danger focus:ring-danger/20',
    success: 'border-success focus:border-success focus:ring-success/20',
  };

  const classes = [
    baseClasses,
    sizeClasses[inputSize],
    statusClasses[status],
    fullWidth ? 'w-full' : '',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
    icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
    className,
  ].join(' ');

  const iconWrapperClasses = [
    'absolute inset-y-0 flex items-center pointer-events-none',
    iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3',
  ].join(' ');

  return (
    <div className={`relative inline-block ${fullWidth ? 'w-full' : ''}`}>
      {icon && (
        <div className={iconWrapperClasses}>
          {icon}
        </div>
      )}
      <input
        className={classes}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default Input; 