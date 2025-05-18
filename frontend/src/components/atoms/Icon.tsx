import React, { SVGProps } from 'react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconColor = 'inherit' | 'current' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray';

interface IconProps {
  size?: IconSize;
  color?: IconColor;
  className?: string;
  children: React.ReactNode;
}

const Icon: React.FC<IconProps> = ({
  size = 'md',
  color = 'current',
  className = '',
  children,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const colorClasses = {
    inherit: '',
    current: 'text-current',
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    gray: 'text-gray-500',
  };

  const classes = [
    sizeClasses[size],
    colorClasses[color],
    'inline-block flex-shrink-0',
    className,
  ].join(' ');

  // Clone the child element (expected to be an SVG) and add our classes
  const iconElement = React.Children.only(children);
  if (!React.isValidElement<SVGProps<SVGSVGElement>>(iconElement)) {
    return null;
  }

  return React.cloneElement(iconElement, {
    className: classes,
    'aria-hidden': 'true',
    ...iconElement.props as SVGProps<SVGSVGElement>,
  });
};

export default Icon; 