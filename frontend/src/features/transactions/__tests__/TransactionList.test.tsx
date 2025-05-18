import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TransactionList from '../TransactionList';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const api = require('@/lib/api').default;

describe('TransactionList', () => {
  it('renders fetched transactions', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        transactions: [
          { id: '1', date: '2024-01-01', description: 'Test', amount: 10, category: 'Food' },
        ],
        pagination: { page: 1, limit: 50, total: 1, pages: 1 },
      },
    });

    render(<TransactionList />);

    expect(screen.getByText(/Loading transactions/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
