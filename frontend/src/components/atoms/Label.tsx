import React, { LabelHTMLAttributes } from 'react';

type LabelSize = 'sm' | 'md' | 'lg';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  labelSize?: LabelSize;
}

const Label: React.FC<LabelProps> = ({
  required = false,
  labelSize = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'block font-medium text-gray-700';
  
  const sizeClasses = {
    sm: 'text-sm mb-1',
    md: 'text-base mb-1.5',
    lg: 'text-lg mb-2',
  };

  const classes = [
    baseClasses,
    sizeClasses[labelSize],
    className,
  ].join(' ');

  return (
    <label className={classes} {...props}>
      {children}
      {required && (
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
};

export default Label; 