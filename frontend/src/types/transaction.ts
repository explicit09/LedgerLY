export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  isRecurring?: boolean;
  notes?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
