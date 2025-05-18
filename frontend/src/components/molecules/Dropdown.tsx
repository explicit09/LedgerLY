import React, { useState, useRef, useEffect } from 'react';
import Button from '../atoms/Button';

interface DropdownItem {
  label: React.ReactNode;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  triggerText?: string;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  trigger,
  triggerText = 'Select',
  position = 'left',
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'w-40',
    md: 'w-48',
    lg: 'w-56',
  };

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="secondary"
          size={size}
        >
          {triggerText}
        </Button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-10 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5
            ${sizeClasses[size]} ${positionClasses[position]}
          `}
        >
          <div className="py-1" role="menu">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className={`
                  w-full text-left px-4 py-2 text-sm
                  ${item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                  flex items-center gap-2
                `}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown; 