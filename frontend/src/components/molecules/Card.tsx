import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  footer,
  padding = 'md',
  className = '',
  children,
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const contentPaddingClasses = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const classes = [
    baseClasses,
    className,
  ].join(' ');

  return (
    <div className={classes}>
      {title && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]}`}>
          {typeof title === 'string' ? (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}

      <div className={contentPaddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className={`border-t border-gray-200 ${paddingClasses[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 