import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import Dropdown from '../molecules/Dropdown';

interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface UserMenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface NavigationProps {
  items: NavigationItem[];
  userMenuActions: UserMenuAction[];
  userDisplayName: string;
  logo?: React.ReactNode;
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  userMenuActions,
  userDisplayName,
  logo,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderDesktopNavigation = () => (
    <>
      <div className="flex items-center gap-8">
        {logo && (
          <div className="flex-shrink-0">
            {logo}
          </div>
        )}
        <div className="hidden md:flex items-center gap-4">
          {items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                transition-colors duration-200
                ${isActive(item.path)
                  ? 'text-primary bg-primary/5'
                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                }
              `}
            >
              {item.icon && (
                <Icon size="sm" color={isActive(item.path) ? 'primary' : 'gray'}>
                  {item.icon}
                </Icon>
              )}
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <Dropdown
          trigger={
            <Button variant="secondary">
              {userDisplayName}
            </Button>
          }
          items={userMenuActions.map(action => ({
            label: action.label,
            value: action.label,
            icon: action.icon,
            onClick: action.onClick,
          }))}
          position="right"
        />
      </div>
    </>
  );

  const renderMobileNavigation = () => (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1">
        {items.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex items-center gap-2 px-3 py-2 text-base font-medium rounded-md
              transition-colors duration-200
              ${isActive(item.path)
                ? 'text-primary bg-primary/5'
                : 'text-gray-700 hover:text-primary hover:bg-gray-50'
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.icon && (
              <Icon size="sm" color={isActive(item.path) ? 'primary' : 'gray'}>
                {item.icon}
              </Icon>
            )}
            {item.label}
          </Link>
        ))}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="px-3 space-y-1">
            {userMenuActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
              >
                {action.icon && (
                  <Icon size="sm" color="gray">
                    {action.icon}
                  </Icon>
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <nav className={`bg-white shadow ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Desktop Navigation */}
          {renderDesktopNavigation()}

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <Icon size="lg">
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </Icon>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && renderMobileNavigation()}
    </nav>
  );
};

export default Navigation; 