import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import Dropdown from '../molecules/Dropdown';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    disabled?: (row: T) => boolean;
  }[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
  className?: string;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  actions,
  onSort,
  sortColumn,
  sortDirection,
  pagination,
  emptyMessage = 'No data available',
  className = '',
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection = 
      sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const isActive = sortColumn === column.key;
    return (
      <span className="ml-2">
        <Icon
          size="sm"
          color={isActive ? 'primary' : 'gray'}
          className={sortDirection === 'desc' ? 'rotate-180' : ''}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </Icon>
      </span>
    );
  };

  const renderPagination = () => {
    if (!pagination) return null;
    const { currentPage, totalPages, onPageChange } = pagination;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const renderCellContent = (column: Column<T>, row: T): React.ReactNode => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    const value = row[column.key];
    if (value == null) return null;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (!data.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer select-none' : ''}
                  ${column.width ? `w-[${column.width}]` : ''}
                `}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <div className="flex items-center">
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
            {actions && <th scope="col" className="relative px-6 py-3" />}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(row => (
            <tr key={keyExtractor(row)}>
              {columns.map(column => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {renderCellContent(column, row)}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Dropdown
                    items={actions.map(action => ({
                      label: action.label,
                      value: action.label,
                      icon: action.icon,
                      disabled: action.disabled?.(row),
                      onClick: () => action.onClick(row),
                    }))}
                    position="right"
                    triggerText="Actions"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );
}

export default Table; 